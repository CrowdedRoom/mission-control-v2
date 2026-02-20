import { NextResponse } from 'next/server'

export type CronJob = {
  id: string
  name: string
  enabled: boolean
  schedule: {
    kind: 'cron' | 'every' | 'at'
    expr?: string
    tz?: string
    everyMs?: number
  }
  state: {
    nextRunAtMs?: number
    lastRunAtMs?: number
    lastStatus?: 'ok' | 'error' | 'running'
    consecutiveErrors?: number
    lastError?: string
  }
  payload: {
    kind: 'agentTurn' | 'systemEvent'
  }
}

export async function GET() {
  try {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN

    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
    }

    const res = await fetch(`${gatewayUrl}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tool: 'cron', args: { action: 'list' } }),
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Gateway error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const jobs: CronJob[] = data?.result?.details?.jobs ?? []

    return NextResponse.json({ jobs })
  } catch (err) {
    console.error('[/api/crons]', err)
    return NextResponse.json({ error: 'Failed to fetch cron jobs' }, { status: 500 })
  }
}
