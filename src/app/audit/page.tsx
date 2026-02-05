'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  AlertCircle, 
  Zap, 
  Bug, 
  TrendingUp,
  ChevronRight,
  Filter,
  CheckCircle2,
  Edit2,
  X,
  Check,
  Trash2
} from 'lucide-react'

interface AuditItem {
  id: string
  project: string
  category: 'quick-win' | 'bug' | 'tech-debt' | 'feature'
  title: string
  description: string
  effort: 'quick' | 'medium' | 'large'
  impact: 'high' | 'medium' | 'low'
  status: 'backlog' | 'in-progress' | 'done'
  priority: 1 | 2 | 3
}

const defaultItems: AuditItem[] = [
  // poker-sesh quick wins
  {
    id: 'ps-1',
    project: 'poker-sesh',
    category: 'quick-win',
    title: 'Session Duration Tracking',
    description: 'Add session_duration_minutes to analytics. Calculate from created_at → completed_at.',
    effort: 'quick',
    impact: 'high',
    status: 'backlog',
    priority: 1
  },
  {
    id: 'ps-2',
    project: 'poker-sesh',
    category: 'quick-win',
    title: 'User Detection in Leaderboard',
    description: 'Pass current user ID to highlight player\'s own ranking on leaderboard.',
    effort: 'quick',
    impact: 'high',
    status: 'backlog',
    priority: 1
  },
  {
    id: 'ps-3',
    project: 'poker-sesh',
    category: 'quick-win',
    title: 'Group Session Editing',
    description: 'Connect edit form to Supabase update for session details post-play.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'ps-4',
    project: 'poker-sesh',
    category: 'bug',
    title: 'Analytics Gaps',
    description: 'No session duration, position tracking, or game type data in schema.',
    effort: 'large',
    impact: 'medium',
    status: 'backlog',
    priority: 3
  },

  // sticker-app quick wins
  {
    id: 'sa-1',
    project: 'sticker-app',
    category: 'quick-win',
    title: 'AI Simulation Toggle',
    description: 'Add UI switch for testing without OpenAI API calls (USE_AI_SIMULATION env var).',
    effort: 'quick',
    impact: 'high',
    status: 'backlog',
    priority: 1
  },
  {
    id: 'sa-2',
    project: 'sticker-app',
    category: 'quick-win',
    title: 'Email Notifications',
    description: 'Send email when sticker design completes using Resend API.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'sa-3',
    project: 'sticker-app',
    category: 'quick-win',
    title: 'Design History/Drafts',
    description: 'Save drafts locally (localStorage) so users can resume incomplete designs.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'sa-4',
    project: 'sticker-app',
    category: 'bug',
    title: 'No Error Handling',
    description: 'Add error handling for OpenAI API failures and rate limiting.',
    effort: 'medium',
    impact: 'medium',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'sa-5',
    project: 'sticker-app',
    category: 'tech-debt',
    title: 'Missing E2E Tests',
    description: 'Add Playwright tests for critical user flows.',
    effort: 'large',
    impact: 'medium',
    status: 'backlog',
    priority: 3
  },

  // clayboss quick wins
  {
    id: 'cb-1',
    project: 'clayboss',
    category: 'quick-win',
    title: 'Offline Support',
    description: 'Cache guide data when downloaded and show cached data when offline.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'cb-2',
    project: 'clayboss',
    category: 'quick-win',
    title: 'Search/Filter Guides',
    description: 'Add search box and filters by technique, material, difficulty.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'cb-3',
    project: 'clayboss',
    category: 'bug',
    title: 'No Error Boundaries',
    description: 'Add error boundaries to prevent crashes on bad guide data.',
    effort: 'quick',
    impact: 'medium',
    status: 'backlog',
    priority: 2
  },

  // mission-control quick wins
  {
    id: 'mc-1',
    project: 'mission-control',
    category: 'quick-win',
    title: 'Fix ESLint Warnings',
    description: 'Add missing dependencies to useEffect hooks in Calendar, Docs, SmartDashboard.',
    effort: 'quick',
    impact: 'medium',
    status: 'backlog',
    priority: 1
  },
  {
    id: 'mc-2',
    project: 'mission-control',
    category: 'quick-win',
    title: 'Calendar Export',
    description: 'Export calendar as .ics for import into Apple Calendar, Google Calendar, etc.',
    effort: 'medium',
    impact: 'high',
    status: 'backlog',
    priority: 2
  },
  {
    id: 'mc-3',
    project: 'mission-control',
    category: 'bug',
    title: 'Missing API Error Handling',
    description: 'Add error handling and retry logic to API calls.',
    effort: 'medium',
    impact: 'medium',
    status: 'backlog',
    priority: 2
  }
]

const getCategoryIcon = (category: AuditItem['category']) => {
  switch (category) {
    case 'quick-win':
      return <Zap className="w-4 h-4" />
    case 'bug':
      return <AlertCircle className="w-4 h-4" />
    case 'tech-debt':
      return <TrendingUp className="w-4 h-4" />
    case 'feature':
      return <CheckCircle2 className="w-4 h-4" />
  }
}

const getCategoryColor = (category: AuditItem['category']) => {
  switch (category) {
    case 'quick-win':
      return 'bg-green-900/30 text-green-200 border-green-800'
    case 'bug':
      return 'bg-red-900/30 text-red-200 border-red-800'
    case 'tech-debt':
      return 'bg-yellow-900/30 text-yellow-200 border-yellow-800'
    case 'feature':
      return 'bg-blue-900/30 text-blue-200 border-blue-800'
  }
}

const getEfffortColor = (effort: AuditItem['effort']) => {
  switch (effort) {
    case 'quick':
      return 'bg-emerald-900/30 text-emerald-200 border-emerald-800'
    case 'medium':
      return 'bg-amber-900/30 text-amber-200 border-amber-800'
    case 'large':
      return 'bg-rose-900/30 text-rose-200 border-rose-800'
  }
}

const getImpactColor = (impact: AuditItem['impact']) => {
  switch (impact) {
    case 'high':
      return 'text-green-400'
    case 'medium':
      return 'text-yellow-400'
    case 'low':
      return 'text-gray-400'
  }
}

export default function AuditPage() {
  const router = useRouter()
  const [items, setItems] = useState<AuditItem[]>(defaultItems)
  const [filter, setFilter] = useState<'all' | AuditItem['category']>('all')
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AuditItem>>({})

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false
    if (projectFilter !== 'all' && item.project !== projectFilter) return false
    return true
  })

  const projects = ['poker-sesh', 'sticker-app', 'clayboss', 'mission-control']
  const quickWins = filtered.filter(i => i.category === 'quick-win')
  const bugs = filtered.filter(i => i.category === 'bug')
  const techDebt = filtered.filter(i => i.category === 'tech-debt')

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const startEdit = (item: AuditItem) => {
    setEditingId(item.id)
    setEditData(item)
  }

  const saveEdit = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, ...editData } : item))
    setEditingId(null)
    setEditData({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const createTasks = () => {
    const selectedItems = items.filter(item => selected.has(item.id))
    
    // Store tasks in sessionStorage for the tasks page to pick up
    const tasks = selectedItems.map(item => ({
      id: `task-${item.id}`,
      title: item.title,
      description: item.description,
      project: item.project,
      priority: item.priority,
      createdFrom: item.id,
      status: 'todo' as const
    }))
    
    sessionStorage.setItem('tasksToCreate', JSON.stringify(tasks))
    
    // Clear selection and navigate
    setSelected(new Set())
    router.push('/tasks')
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    selected.delete(id)
    setSelected(new Set(selected))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">Project Audit</h1>
              <p className="text-slate-400">Issues, quick wins, and shipping priorities</p>
            </div>
            <Link 
              href="/docs"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
            >
              View full audit <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-700">
              <div className="text-sm text-slate-400">Total Items</div>
              <div className="text-3xl font-bold text-slate-100">{items.length}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-700">
              <div className="text-sm text-slate-400">Quick Wins</div>
              <div className="text-3xl font-bold text-green-400">{quickWins.length}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-700">
              <div className="text-sm text-slate-400">Known Bugs</div>
              <div className="text-3xl font-bold text-red-400">{bugs.length}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-700">
              <div className="text-sm text-slate-400">Tech Debt</div>
              <div className="text-3xl font-bold text-yellow-400">{techDebt.length}</div>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="mb-6 flex gap-4 items-end">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Category</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-lg text-sm hover:border-slate-500 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="quick-win">Quick Wins</option>
              <option value="bug">Bugs</option>
              <option value="tech-debt">Tech Debt</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Project</label>
            <select 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded-lg text-sm hover:border-slate-500 transition-colors"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selected.size > 0 && (
            <div className="flex gap-2 ml-auto">
              <span className="text-sm text-slate-400 self-center px-3 py-2">
                {selected.size} selected
              </span>
              <button
                onClick={createTasks}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Tasks
              </button>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div 
              key={item.id}
              className={`bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-blue-500 ${
                selected.has(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Checkbox & Header */}
              <div className="flex items-start justify-between mb-3 gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className={`p-2 rounded border ${getCategoryColor(item.category)}`}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">{item.project}</span>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded border ${getEfffortColor(item.effort)}`}>
                  {item.effort === 'quick' ? '⚡' : item.effort === 'medium' ? '⏱️' : '🔧'} {item.effort}
                </div>
              </div>

              {/* Title - Editable */}
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full text-lg font-bold text-slate-100 bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-2"
                />
              ) : (
                <h3 className="text-lg font-bold text-slate-100 mb-2 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => startEdit(item)}>
                  {item.title}
                </h3>
              )}

              {/* Description - Editable */}
              {editingId === item.id ? (
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full text-slate-300 bg-slate-700 border border-slate-600 rounded px-2 py-1 mb-4 text-sm"
                  rows={3}
                />
              ) : (
                <p className="text-slate-400 text-sm mb-4 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => startEdit(item)}>
                  {item.description}
                </p>
              )}

              {/* Status - Editable */}
              {editingId === item.id ? (
                <select
                  value={editData.status || 'backlog'}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded text-sm mb-4"
                >
                  <option value="backlog">Backlog</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Status: </span>
                  <span className="text-sm text-slate-300">{item.status}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs border-t border-slate-700 pt-3">
                <span className={`font-semibold ${getImpactColor(item.impact)}`}>
                  {item.impact.toUpperCase()} IMPACT
                </span>
                <span className="text-slate-500">P{item.priority}</span>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-3">🚀 Week 1 Priorities</h2>
          <ol className="space-y-2 text-slate-300">
            <li>1. <strong>poker-sesh</strong>: Session duration tracking + user detection (1.5h)</li>
            <li>2. <strong>mission-control</strong>: Fix ESLint warnings (0.5h)</li>
            <li>3. <strong>sticker-app</strong>: AI simulation toggle + error handling (1h)</li>
          </ol>
          <p className="text-sm text-slate-400 mt-4">
            Total: ~3 hours of high-impact shipping that unlocks several features.
          </p>
        </div>
      </div>
    </div>
  )
}
