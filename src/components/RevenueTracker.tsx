'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, X, TrendingUp, Target, Rocket, DollarSign } from 'lucide-react'
import type { RevenueGoal } from '@/lib/db-sqlite'

const MILESTONES = [
  { threshold: 0, emoji: '💵', label: 'First Dollar' },
  { threshold: 100, emoji: '☕', label: 'Coffee money' },
  { threshold: 500, emoji: '🍕', label: 'Pizza money' },
  { threshold: 1000, emoji: '💪', label: 'Side hustle' },
  { threshold: 3000, emoji: '🚀', label: 'Ramen profitable' },
  { threshold: 8000, emoji: '🏖️', label: 'Part-time free' },
  { threshold: 10417, emoji: '🎯', label: 'Half way' },
  { threshold: 20833, emoji: '🏆', label: 'Financial Independence' },
]

function getNextMilestone(revenue: number) {
  for (const milestone of MILESTONES) {
    if (revenue <= milestone.threshold) {
      return milestone
    }
  }
  return MILESTONES[MILESTONES.length - 1]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getProgressColor(percent: number): string {
  if (percent === 0) return 'bg-slate-600'
  if (percent < 10) return 'bg-yellow-500'
  if (percent < 50) return 'bg-yellow-400'
  return 'bg-green-500'
}

function getTimeToFI(monthlyRevenue: number, targetMonthly: number): string {
  if (monthlyRevenue >= targetMonthly) return 'Achieved!'
  if (monthlyRevenue === 0) return '12 yrs (est.)'

  // Assume linear growth trajectory
  const yearsRemaining = Math.ceil((targetMonthly - monthlyRevenue) / (monthlyRevenue / 2))
  return `${Math.min(yearsRemaining, 12)} yrs (est.)`
}

export function RevenueTracker() {
  const [goal, setGoal] = useState<RevenueGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editRevenue, setEditRevenue] = useState('')
  const [editApps, setEditApps] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchGoal = useCallback(async () => {
    try {
      const res = await fetch('/api/revenue')
      if (res.ok) {
        const data = await res.json()
        setGoal(data)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoal()
    const interval = setInterval(fetchGoal, 5 * 60 * 1000) // 5 min refresh
    return () => clearInterval(interval)
  }, [fetchGoal])

  const handleEdit = () => {
    if (goal) {
      setEditRevenue(goal.monthly_revenue.toString())
      setEditApps(goal.apps_live.toString())
      setEditNotes(goal.notes || '')
    }
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/revenue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_revenue: parseInt(editRevenue) || 0,
          apps_live: parseInt(editApps) || 0,
          notes: editNotes || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGoal(data)
        setIsEditing(false)
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="h-40 bg-slate-700/50 rounded animate-pulse" />
      </div>
    )
  }

  if (!goal) return null

  const percent = Math.min(100, Math.round((goal.monthly_revenue / goal.target_monthly) * 100))
  const nextMilestone = getNextMilestone(goal.monthly_revenue)

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h2 className="text-lg font-semibold text-slate-100">Revenue Goal</h2>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <Pencil size={14} />
            edit
          </button>
        )}
      </div>

      {isEditing ? (
        /* Edit Modal */
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Monthly Revenue ($)</label>
            <input
              type="number"
              value={editRevenue}
              onChange={(e) => setEditRevenue(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Apps Live</label>
            <input
              type="number"
              value={editApps}
              onChange={(e) => setEditApps(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
              placeholder="Progress notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <>
          {/* Main Progress */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-slate-100">
                {formatCurrency(goal.monthly_revenue)}
              </span>
              <span className="text-slate-400">/ mo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(percent)} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${percent >= 50 ? 'text-green-400' : percent > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {percent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              of {formatCurrency(goal.target_monthly)} target
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                <Rocket size={14} />
                <span className="text-xs">Apps Live</span>
              </div>
              <p className="text-lg font-bold text-slate-100">{goal.apps_live}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                <DollarSign size={14} />
                <span className="text-xs">Monthly</span>
              </div>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(goal.monthly_revenue)}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                <Target size={14} />
                <span className="text-xs">To FI</span>
              </div>
              <p className="text-lg font-bold text-slate-100">{getTimeToFI(goal.monthly_revenue, goal.target_monthly)}</p>
            </div>
          </div>

          {/* Next Milestone */}
          <div className="bg-slate-700/30 rounded-lg p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Next milestone:</span>
            </div>
            <span className="text-sm font-medium text-slate-200">
              {nextMilestone.emoji} {nextMilestone.label}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
