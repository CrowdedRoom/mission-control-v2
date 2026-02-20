'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
  Zap,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { TeamData, SubagentSession } from '../api/team/route'
import { CronJob } from '../api/crons/route'
import { Task } from '@/lib/types'

type TaskStats = {
  createdThisWeek: number
  completedThisWeek: number
  totalCompleted: number
  daysActive: number
}

function parseSchedule(job: CronJob): string {
  const { schedule } = job
  if (schedule.kind === 'cron' && schedule.expr) {
    // Parse common cron patterns
    const parts = schedule.expr.split(' ')
    if (parts.length >= 5) {
      const [minute, hour, , , dayOfWeek] = parts
      const hourNum = parseInt(hour)
      const minuteNum = parseInt(minute)
      const timeStr = format(new Date().setHours(hourNum, minuteNum), 'h:mm a')

      if (dayOfWeek === '*') {
        return `Daily at ${timeStr}`
      } else if (dayOfWeek === '1-5') {
        return `Weekdays at ${timeStr}`
      } else if (dayOfWeek === '0,6') {
        return `Weekends at ${timeStr}`
      }
      return `At ${timeStr}`
    }
    return schedule.expr
  } else if (schedule.kind === 'every' && schedule.everyMs) {
    const minutes = Math.round(schedule.everyMs / 60000)
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60)
      return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `Every ${minutes} min${minutes > 1 ? 's' : ''}`
  }
  return 'Custom schedule'
}

function getNextRun(job: CronJob): string {
  if (!job.state.nextRunAtMs) return 'Not scheduled'
  const nextRun = new Date(job.state.nextRunAtMs)
  return formatDistanceToNow(nextRun, { addSuffix: true })
}

function StatusDot({ status }: { status: 'online' | 'busy' | 'idle' | 'ok' | 'error' | 'running' | undefined }) {
  const colors = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500',
    idle: 'bg-slate-500',
    ok: 'bg-green-500',
    error: 'bg-red-500',
    running: 'bg-blue-500',
  }
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${colors[status || 'idle']} ${
        status === 'running' || status === 'busy' ? 'animate-pulse' : ''
      }`}
    />
  )
}

export default function TeamPage() {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamRes, tasksRes] = await Promise.all([
          fetch('/api/team'),
          fetch('/api/tasks'),
        ])

        if (!teamRes.ok) throw new Error('Failed to fetch team data')
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks')

        const team: TeamData = await teamRes.json()
        const tasks: Task[] = await tasksRes.json()

        // Calculate task stats
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const createdThisWeek = tasks.filter(
          (t) => new Date(t.created_at) >= weekAgo
        ).length

        const completedThisWeek = tasks.filter(
          (t) => t.status === 'done' && new Date(t.updated_at) >= weekAgo
        ).length

        const totalCompleted = tasks.filter((t) => t.status === 'done').length

        // Calculate days active (since first task)
        const firstTask = tasks.reduce((oldest, t) => {
          const date = new Date(t.created_at)
          return date < oldest ? date : oldest
        }, now)
        const daysActive = Math.max(
          1,
          Math.ceil((now.getTime() - firstTask.getTime()) / (24 * 60 * 60 * 1000))
        )

        setTeamData(team)
        setTaskStats({
          createdThisWeek,
          completedThisWeek,
          totalCompleted,
          daysActive,
        })
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-48" />
          <div className="h-24 bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  const { larry, cronJobs, recentSubagents } = teamData!
  const stats = taskStats!

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Team</h1>
        <p className="text-slate-400">The crew behind Mission Control.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          value={larry.cronJobs}
          label="Cron Jobs"
        />
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          value={recentSubagents.length}
          label="Sub-agents"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          value={stats.totalCompleted}
          label="Tasks Completed"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          value={stats.daysActive}
          label="Days Active"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - The Crew */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            The Crew
          </h2>

          {/* DJ White Card */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">👤</span>
                <div>
                  <h3 className="font-semibold text-slate-100">DJ White</h3>
                  <p className="text-sm text-slate-400">Product Owner & Founder</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status="online" />
                <span className="text-xs text-slate-400">online</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{stats.createdThisWeek}</p>
                <p className="text-xs text-slate-400">Tasks this week</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{stats.completedThisWeek}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>

          {/* Larry Card */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🦝</span>
                <div>
                  <h3 className="font-semibold text-slate-100">Larry</h3>
                  <p className="text-sm text-slate-400">AI Operations Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={larry.status} />
                <span className="text-xs text-slate-400">{larry.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{larry.cronJobs}</p>
                <p className="text-xs text-slate-400">Cron Jobs</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-100">
                  {larry.cronErrors > 0 ? (
                    <span className="text-red-400">{larry.cronErrors}</span>
                  ) : (
                    '0'
                  )}
                </p>
                <p className="text-xs text-slate-400">Errors</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{recentSubagents.length}</p>
                <p className="text-xs text-slate-400">Sub-agents</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>claude-sonnet-4-6</span>
              </div>
              <span className="text-slate-500">Active · just now</span>
            </div>
          </div>
        </div>

        {/* Right Column - Sub-Agent Roster */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            Sub-Agent Roster
          </h2>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {recentSubagents.length === 0 ? (
              <div className="p-8 text-center">
                <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-1">No sub-agents spawned recently.</p>
                <p className="text-sm text-slate-500">
                  Larry spins these up for complex tasks.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {recentSubagents.map((agent) => (
                  <SubagentRow key={agent.sessionKey} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cron Schedule Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-400" />
          Cron Schedule Overview
        </h2>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {cronJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No cron jobs configured.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {cronJobs.map((job) => (
                <CronJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-3">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function SubagentRow({ agent }: { agent: SubagentSession }) {
  const label = agent.label || agent.sessionKey
  const truncatedLabel = label.length > 30 ? label.slice(0, 30) + '...' : label

  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Bot className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-sm text-slate-100 truncate" title={label}>
          {truncatedLabel}
        </span>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            agent.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-slate-600/50 text-slate-400'
          }`}
        >
          {agent.status}
        </span>
        <span className="text-xs text-slate-500 w-24 text-right">
          {agent.updatedAt
            ? formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })
            : 'Unknown'}
        </span>
      </div>
    </div>
  )
}

function CronJobRow({ job }: { job: CronJob }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <StatusDot status={job.state.lastStatus} />
        <div className="min-w-0">
          <p className="text-sm text-slate-100 truncate">{job.name}</p>
          <p className="text-xs text-slate-500">{parseSchedule(job)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {(job.state.consecutiveErrors ?? 0) > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
            {job.state.consecutiveErrors} error{job.state.consecutiveErrors !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-xs text-slate-500 w-28 text-right">
          {job.enabled ? getNextRun(job) : 'Disabled'}
        </span>
      </div>
    </div>
  )
}
