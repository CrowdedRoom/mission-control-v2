'use client'

import { useState, useEffect } from 'react'
import { PipelineApp } from '@/lib/db-sqlite'
import { ExternalLink, Edit3, X, ChevronRight, DollarSign } from 'lucide-react'

const PHASE_CONFIG: Record<string, { label: string; emoji: string }> = {
  build: { label: 'Build', emoji: '🔨' },
  test: { label: 'Test', emoji: '🧪' },
  'app-store': { label: 'App Store', emoji: '🍎' },
  live: { label: 'Live', emoji: '🚀' },
  revenue: { label: 'Revenue', emoji: '💰' },
}

export default function PipelinePage() {
  const [apps, setApps] = useState<PipelineApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingApp, setEditingApp] = useState<PipelineApp | null>(null)
  const [editBlocker, setEditBlocker] = useState('')
  const [editNextAction, setEditNextAction] = useState('')
  const [editAssignee, setEditAssignee] = useState<'dj' | 'larry' | null>(null)

  useEffect(() => {
    loadApps()
  }, [])

  const loadApps = async () => {
    try {
      const res = await fetch('/api/pipeline')
      if (res.ok) {
        setApps(await res.json())
      }
    } catch (error) {
      console.error('Failed to load apps:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateApp = async (id: string, updates: Partial<PipelineApp>) => {
    try {
      const res = await fetch(`/api/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        setApps(apps.map(a => a.id === id ? updated : a))
        return updated
      }
    } catch (error) {
      console.error('Failed to update app:', error)
    }
    return null
  }

  const advancePhase = async (app: PipelineApp) => {
    const currentIdx = app.phases.indexOf(app.phase)
    if (currentIdx < app.phases.length - 1) {
      const nextPhase = app.phases[currentIdx + 1]
      await updateApp(app.id, { phase: nextPhase })
    }
  }

  const openEditModal = (app: PipelineApp) => {
    setEditingApp(app)
    setEditBlocker(app.blocker || '')
    setEditNextAction(app.next_action || '')
    setEditAssignee(app.assignee)
  }

  const saveEdit = async () => {
    if (!editingApp) return
    await updateApp(editingApp.id, {
      blocker: editBlocker || null,
      next_action: editNextAction || null,
      assignee: editAssignee,
    })
    setEditingApp(null)
  }

  const totalRevenue = apps.reduce((sum, app) => sum + app.revenue_monthly, 0)
  const revenueGoal = 5000 // $5k/month goal for financial independence milestone

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">
          🚀 App Pipeline
        </h1>
        <p className="text-sm md:text-base text-slate-400">
          Your path to financial independence
        </p>
      </div>

      {/* Revenue Summary Bar */}
      <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-400" size={20} />
            <span className="font-semibold text-slate-100">Monthly Revenue</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</span>
            <span className="text-slate-400 text-sm ml-2">/ ${revenueGoal.toLocaleString()} goal</span>
          </div>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-gradient-to-r from-green-500 to-emerald-400"
            style={{ width: `${Math.min(100, (totalRevenue / revenueGoal) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {totalRevenue >= revenueGoal
            ? '🎉 Goal reached! Keep growing!'
            : `$${(revenueGoal - totalRevenue).toLocaleString()} to go`}
        </p>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {apps.map(app => {
          const currentPhaseIdx = app.phases.indexOf(app.phase)
          const hasBlocker = !!app.blocker
          const isRevenue = app.phase === 'revenue'
          const canAdvance = currentPhaseIdx < app.phases.length - 1

          return (
            <div
              key={app.id}
              className={`bg-slate-800 rounded-xl p-5 border transition-all ${
                hasBlocker
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : isRevenue
                  ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Header: emoji + name + stack + assignee */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{app.emoji}</span>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{app.name}</h3>
                    {app.stack && (
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-400">
                        {app.stack}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Assignee Badge */}
                  {app.assignee && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        app.assignee === 'larry'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {app.assignee === 'larry' ? '🦝 Larry' : '👤 DJ'}
                    </span>
                  )}
                  {/* External link if store_url */}
                  {app.store_url && (
                    <a
                      href={app.store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <ExternalLink size={16} className="text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  {app.phases.map((phase, idx) => {
                    const config = PHASE_CONFIG[phase] || { label: phase, emoji: '📦' }
                    const isCurrent = phase === app.phase
                    const isCompleted = idx < currentPhaseIdx
                    const isFuture = idx > currentPhaseIdx

                    return (
                      <div key={phase} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full h-2 rounded-full transition-all ${
                            isCompleted
                              ? ''
                              : isCurrent
                              ? 'animate-pulse'
                              : 'bg-slate-700'
                          }`}
                          style={{
                            backgroundColor: isCompleted || isCurrent ? app.color : undefined,
                            opacity: isCurrent ? 1 : isCompleted ? 0.7 : undefined,
                          }}
                        />
                        <span
                          className={`text-[10px] mt-1 ${
                            isCurrent
                              ? 'text-slate-100 font-medium'
                              : isFuture
                              ? 'text-slate-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {config.emoji}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-center mt-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${app.color}30`, color: app.color }}
                  >
                    {PHASE_CONFIG[app.phase]?.label || app.phase}
                  </span>
                </div>
              </div>

              {/* Blocker Section */}
              {app.blocker && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-sm">⚠️</span>
                    <p className="text-sm text-red-300">{app.blocker}</p>
                  </div>
                </div>
              )}

              {/* Next Action Section */}
              {app.next_action && (
                <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 text-sm">→</span>
                    <div>
                      <p className="text-sm text-green-300">{app.next_action}</p>
                      {app.assignee && (
                        <span className="text-xs text-slate-500 mt-1 block">
                          Assigned to {app.assignee === 'larry' ? '🦝 Larry' : '👤 DJ'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom: Revenue + Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-lg ${
                      app.revenue_monthly > 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    ${app.revenue_monthly}/mo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} className="text-slate-400" />
                  </button>
                  {canAdvance && (
                    <button
                      onClick={() => advancePhase(app)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: `${app.color}20`,
                        color: app.color,
                      }}
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100">
                Edit {editingApp.emoji} {editingApp.name}
              </h2>
              <button
                onClick={() => setEditingApp(null)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Blocker
                </label>
                <textarea
                  value={editBlocker}
                  onChange={e => setEditBlocker(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="What's blocking progress?"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Next Action
                </label>
                <textarea
                  value={editNextAction}
                  onChange={e => setEditNextAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="What needs to happen next?"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Assignee
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditAssignee('dj')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      editAssignee === 'dj'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    👤 DJ
                  </button>
                  <button
                    onClick={() => setEditAssignee('larry')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      editAssignee === 'larry'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    🦝 Larry
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
