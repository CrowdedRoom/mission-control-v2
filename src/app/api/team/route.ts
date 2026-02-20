import { NextResponse } from 'next/server'
import { CronJob } from '../crons/route'

export type SubagentSession = {
  sessionKey: string
  label?: string
  updatedAt: string
  kind: string
  status: 'active' | 'completed'
}

export type TeamData = {
  larry: {
    status: 'online' | 'busy' | 'idle'
    activeSessions: number
    cronJobs: number
    cronErrors: number
    recentSubagents: { sessionKey: string; label?: string; updatedAt: string }[]
  }
  cronJobs: CronJob[]
  recentSubagents: SubagentSession[]
}

async function invokeGatewayTool(
  gatewayUrl: string,
  gatewayToken: string,
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${gatewayUrl}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gatewayToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool, args }),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Gateway error: ${res.status}`)
  }

  return res.json()
}

export async function GET() {
  try {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN

    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
    }

    // Fetch all data in parallel
    const [sessionsData, subagentsData, cronData] = await Promise.all([
      invokeGatewayTool(gatewayUrl, gatewayToken, 'sessions_list', {
        limit: 10,
        activeMinutes: 60,
      }),
      invokeGatewayTool(gatewayUrl, gatewayToken, 'sessions_list', {
        kinds: ['subagent'],
        limit: 20,
        messageLimit: 1,
      }),
      invokeGatewayTool(gatewayUrl, gatewayToken, 'cron', { action: 'list' }),
    ])

    // Extract sessions from response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSessions = (sessionsData as any)?.result?.details?.sessions ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subagentSessions = (subagentsData as any)?.result?.details?.sessions ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cronJobs: CronJob[] = (cronData as any)?.result?.details?.jobs ?? []

    // Calculate Larry's status based on active sessions
    const activeCount = activeSessions.length
    let larryStatus: 'online' | 'busy' | 'idle' = 'idle'
    if (activeCount > 2) {
      larryStatus = 'busy'
    } else if (activeCount > 0) {
      larryStatus = 'online'
    }

    // Count cron errors
    const cronErrors = cronJobs.reduce(
      (count, job) => count + (job.state.consecutiveErrors ?? 0),
      0
    )

    // Map subagent sessions to our format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentSubagents: SubagentSession[] = subagentSessions.map((s: any, i: number) => {
      const now = Date.now()
      // updatedAt may be an ISO string or a ms timestamp number
      const updatedAtMs = s.updatedAt
        ? (typeof s.updatedAt === 'number' ? s.updatedAt : new Date(s.updatedAt).getTime())
        : 0
      const updatedAtIso = updatedAtMs ? new Date(updatedAtMs).toISOString() : new Date().toISOString()
      const isActive = now - updatedAtMs < 60 * 60 * 1000

      const sessionKey = s.sessionKey ?? s.id ?? `session-${i}`
      return {
        sessionKey,
        label: s.label || s.name || sessionKey,
        updatedAt: updatedAtIso,
        kind: s.kind ?? 'subagent',
        status: isActive ? 'active' : 'completed',
      }
    })

    const teamData: TeamData = {
      larry: {
        status: larryStatus,
        activeSessions: activeCount,
        cronJobs: cronJobs.length,
        cronErrors,
        recentSubagents: recentSubagents.slice(0, 5).map((s) => ({
          sessionKey: s.sessionKey,
          label: s.label,
          updatedAt: s.updatedAt,
        })),
      },
      cronJobs,
      recentSubagents,
    }

    return NextResponse.json(teamData)
  } catch (err) {
    console.error('[/api/team]', err)
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 })
  }
}
