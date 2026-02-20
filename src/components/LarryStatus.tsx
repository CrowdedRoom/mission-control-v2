'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns'
import type { CronJob } from '@/app/api/crons/route'

function formatNextRun(ms: number): string {
  const date = new Date(ms)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  if (diffMs < 0) return 'overdue'
  if (diffMs < 60 * 1000) return 'in < 1 min'
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.round(diffMs / (60 * 1000))
    return `in ${mins}m`
  }
  if (isToday(date)) return `Today ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow ${format(date, 'h:mm a')}`
  return formatDistanceToNow(date, { addSuffix: true })
}

function StatusDot({ status }: { status?: string }) {
  if (status === 'ok') return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 inline-block" />
  if (status === 'error') return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 inline-block" />
  return <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0 inline-block" />
}

export function LarryStatus() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/crons')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs ?? [])
      }
    } catch {
      // silent fail — gateway may be restarting
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 60_000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  // Sort: errors first, then by next run time
  const sorted = [...jobs].sort((a, b) => {
    const aErr = (a.state.consecutiveErrors ?? 0) > 0
    const bErr = (b.state.consecutiveErrors ?? 0) > 0
    if (aErr && !bErr) return -1
    if (!aErr && bErr) return 1
    return (a.state.nextRunAtMs ?? 0) - (b.state.nextRunAtMs ?? 0)
  })

  const errorCount = jobs.filter(j => (j.state.consecutiveErrors ?? 0) > 0).length

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-100">🦝 Larry Status</h2>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
              <AlertTriangle size={11} />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link href="/calendar" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          Schedule <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-8 bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 text-sm">No cron jobs found</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(job => {
            const hasError = (job.state.consecutiveErrors ?? 0) > 0
            return (
              <div
                key={job.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  hasError ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-700/30'
                }`}
              >
                <StatusDot status={job.state.lastStatus} />
                <span className="text-sm text-slate-300 flex-1 truncate">{job.name}</span>
                {hasError && (
                  <span className="text-xs bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded shrink-0">
                    ⚠️ {job.state.consecutiveErrors}
                  </span>
                )}
                {job.state.nextRunAtMs && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatNextRun(job.state.nextRunAtMs)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
