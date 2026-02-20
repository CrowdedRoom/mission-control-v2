'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { PROJECTS } from '@/lib/types'
import { Plus, X, Send } from 'lucide-react'

type ActivityWithTask = {
  id: string
  task_id: string | null
  action: string
  actor: 'dj' | 'larry' | 'system'
  timestamp: string
  task_title?: string
  task_project?: string
}

type ActorFilter = 'all' | 'larry' | 'dj' | 'system'
type DateFilter = 'all' | 'today' | 'week' | 'month'

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityWithTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actorFilter, setActorFilter] = useState<ActorFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Modal state
  const [logAction, setLogAction] = useState('')
  const [logActor, setLogActor] = useState<'dj' | 'larry'>('dj')
  const [submitting, setSubmitting] = useState(false)

  const loadActivities = useCallback(async (before?: string, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const params = new URLSearchParams()
      params.set('limit', '50')

      if (actorFilter !== 'all') {
        params.set('actor', actorFilter)
      }

      if (before) {
        params.set('before', before)
      }

      const res = await fetch(`/api/activity?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()

        if (append) {
          setActivities(prev => [...prev, ...data])
        } else {
          setActivities(data)
        }

        setHasMore(data.length === 50)
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [actorFilter])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const loadMore = () => {
    if (activities.length > 0 && hasMore && !loadingMore) {
      const lastActivity = activities[activities.length - 1]
      loadActivities(lastActivity.timestamp, true)
    }
  }

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logAction.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: logAction.trim(), actor: logActor })
      })

      if (res.ok) {
        setLogAction('')
        setShowModal(false)
        loadActivities() // Refresh
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter by date client-side
  const filteredActivities = activities.filter(activity => {
    if (dateFilter === 'all') return true

    const activityDate = new Date(activity.timestamp)
    const now = new Date()

    switch (dateFilter) {
      case 'today':
        return activityDate >= startOfDay(now)
      case 'week':
        return activityDate >= startOfWeek(now, { weekStartsOn: 1 })
      case 'month':
        return activityDate >= startOfMonth(now)
      default:
        return true
    }
  })

  // Stats
  const todayCount = activities.filter(a =>
    new Date(a.timestamp) >= startOfDay(new Date())
  ).length
  const djCount = activities.filter(a => a.actor === 'dj').length
  const larryCount = activities.filter(a => a.actor === 'larry').length

  const getActorAvatar = (actor: string) => {
    switch (actor) {
      case 'larry':
        return { emoji: '🦝', bg: 'bg-purple-500/20', text: 'text-purple-400' }
      case 'dj':
        return { emoji: '👤', bg: 'bg-blue-500/20', text: 'text-blue-400' }
      case 'system':
        return { emoji: '⚙️', bg: 'bg-slate-500/20', text: 'text-slate-400' }
      default:
        return { emoji: '?', bg: 'bg-slate-500/20', text: 'text-slate-400' }
    }
  }

  const getProjectBadge = (projectId: string) => {
    const project = PROJECTS.find(p => p.id === projectId)
    if (!project) return null
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: project.color + '20', color: project.color }}
      >
        {project.emoji} {project.name}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          📋 Activity Feed
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Log Entry
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-2xl font-bold text-slate-100">{activities.length}</p>
          <p className="text-xs text-slate-400">Total Entries</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-2xl font-bold text-slate-100">{todayCount}</p>
          <p className="text-xs text-slate-400">Today</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-2xl font-bold text-blue-400">{djCount}</p>
          <p className="text-xs text-slate-400">👤 DJ Actions</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-2xl font-bold text-purple-400">{larryCount}</p>
          <p className="text-xs text-slate-400">🦝 Larry Actions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Actor Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {(['all', 'larry', 'dj', 'system'] as ActorFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setActorFilter(filter)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                actorFilter === filter
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === 'larry' && '🦝 Larry'}
              {filter === 'dj' && '👤 DJ'}
              {filter === 'system' && 'System'}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {(['all', 'today', 'week', 'month'] as DateFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateFilter === filter
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' && 'All Time'}
              {filter === 'today' && 'Today'}
              {filter === 'week' && 'This Week'}
              {filter === 'month' && 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No activity found</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredActivities.map((activity, index) => {
              const avatar = getActorAvatar(activity.actor)
              const isEven = index % 2 === 0

              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-4 hover:bg-slate-700/30 transition-colors ${
                    isEven ? 'bg-slate-800' : 'bg-slate-800/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${avatar.bg}`}>
                    <span className="text-sm">{avatar.emoji}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 text-sm">{activity.action}</p>
                    {(activity.task_title || activity.task_project) && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {activity.task_title && (
                          <span className="text-slate-400 text-xs">{activity.task_title}</span>
                        )}
                        {activity.task_project && getProjectBadge(activity.task_project)}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-xs text-slate-500 cursor-help"
                      title={format(new Date(activity.timestamp), 'PPpp')}
                    >
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredActivities.length > 0 && (
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Log Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-100">Log Activity</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="p-4 space-y-4">
              {/* Actor Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Actor</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLogActor('dj')}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      logActor === 'dj'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    👤 DJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogActor('larry')}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      logActor === 'larry'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🦝 Larry
                  </button>
                </div>
              </div>

              {/* Action Text */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                <textarea
                  value={logAction}
                  onChange={(e) => setLogAction(e.target.value)}
                  placeholder="What happened?"
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  autoFocus
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!logAction.trim() || submitting}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send size={16} />
                {submitting ? 'Logging...' : 'Log Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
