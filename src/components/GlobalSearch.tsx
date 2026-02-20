'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight } from 'lucide-react'
import { Task } from '@/lib/types'

type MemoryFile = {
  path: string
  title: string
  pinned: boolean
  preview?: string
}

type Document = {
  id: string
  title: string
  folder: string
}

type PipelineApp = {
  id: string
  name: string
  emoji: string
  phase: string
}

type SearchResults = {
  tasks: Task[]
  memories: MemoryFile[]
  documents: Document[]
  pipeline: PipelineApp[]
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

const STATUS_ICONS: Record<string, string> = {
  done: '✅',
  in_progress: '🔄',
  review: '👀',
  backlog: '📋',
}

const PHASE_LABELS: Record<string, string> = {
  build: 'Building',
  test: 'Testing',
  'app-store': 'App Store',
  live: 'Live',
  revenue: 'Revenue',
}

export function GlobalSearch({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    memories: [],
    documents: [],
    pipeline: [],
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Build flat list of all results for keyboard navigation
  const flatResults = useMemo(
    () => [
      ...results.tasks.map((t) => ({ type: 'task' as const, item: t })),
      ...results.memories.map((m) => ({ type: 'memory' as const, item: m })),
      ...results.documents.map((d) => ({ type: 'document' as const, item: d })),
      ...results.pipeline.map((p) => ({ type: 'pipeline' as const, item: p })),
    ],
    [results]
  )

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults({ tasks: [], memories: [], documents: [], pipeline: [] })
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!isOpen || query.length < 2) {
      setResults({ tasks: [], memories: [], documents: [], pipeline: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const encodedQuery = encodeURIComponent(query)

        // Fetch all in parallel
        const [tasksRes, memoriesRes, documentsRes, pipelineRes] = await Promise.all([
          fetch(`/api/tasks?q=${encodedQuery}`),
          fetch(`/api/memories?q=${encodedQuery}`),
          fetch(`/api/documents?q=${encodedQuery}`),
          fetch('/api/pipeline'),
        ])

        const [tasks, memoriesData, documents, pipelineApps] = await Promise.all([
          tasksRes.json(),
          memoriesRes.json(),
          documentsRes.json(),
          pipelineRes.json(),
        ])

        // Filter pipeline client-side by name
        const filteredPipeline = (pipelineApps as PipelineApp[]).filter((app) =>
          app.name.toLowerCase().includes(query.toLowerCase())
        )

        setResults({
          tasks: (tasks as Task[]).slice(0, 4),
          memories: (memoriesData.memories as MemoryFile[] || []).slice(0, 4),
          documents: (documents as Document[]).slice(0, 4),
          pipeline: filteredPipeline.slice(0, 4),
        })
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  const navigateTo = useCallback(
    (type: string, item: Task | MemoryFile | Document | PipelineApp) => {
      onClose()
      switch (type) {
        case 'task':
          router.push('/tasks')
          break
        case 'memory':
          router.push(`/memory?file=${encodeURIComponent((item as MemoryFile).path)}`)
          break
        case 'document':
          router.push('/docs')
          break
        case 'pipeline':
          router.push('/pipeline')
          break
      }
    },
    [onClose, router]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (e.key === 'Enter' && flatResults.length > 0) {
        e.preventDefault()
        const selected = flatResults[selectedIndex]
        if (selected) {
          navigateTo(selected.type, selected.item)
        }
        return
      }
    },
    [isOpen, flatResults, selectedIndex, onClose, navigateTo]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getResultIndex = (type: string, index: number): number => {
    let offset = 0
    if (type === 'memory') offset = results.tasks.length
    if (type === 'document') offset = results.tasks.length + results.memories.length
    if (type === 'pipeline')
      offset = results.tasks.length + results.memories.length + results.documents.length
    return offset + index
  }

  if (!isOpen) return null

  const hasResults = flatResults.length > 0
  const showNoResults = query.length >= 2 && !isLoading && !hasResults

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-400 outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-700 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center text-slate-400">
              <div className="animate-pulse">Searching...</div>
            </div>
          )}

          {showNoResults && (
            <div className="px-4 py-8 text-center text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!isLoading && hasResults && (
            <div className="py-2">
              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Tasks
                  </div>
                  {results.tasks.map((task, idx) => (
                    <ResultRow
                      key={task.id}
                      icon={STATUS_ICONS[task.status] || '📋'}
                      title={task.title}
                      badge={task.project}
                      isSelected={selectedIndex === getResultIndex('task', idx)}
                      onClick={() => navigateTo('task', task)}
                      onHover={() => setSelectedIndex(getResultIndex('task', idx))}
                    />
                  ))}
                </div>
              )}

              {/* Memory */}
              {results.memories.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Memory
                  </div>
                  {results.memories.map((mem, idx) => (
                    <ResultRow
                      key={mem.path}
                      icon={mem.pinned ? '📌' : '📄'}
                      title={mem.title}
                      subtitle={mem.preview?.slice(0, 80)}
                      isSelected={selectedIndex === getResultIndex('memory', idx)}
                      onClick={() => navigateTo('memory', mem)}
                      onHover={() => setSelectedIndex(getResultIndex('memory', idx))}
                    />
                  ))}
                </div>
              )}

              {/* Documents */}
              {results.documents.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Documents
                  </div>
                  {results.documents.map((doc, idx) => (
                    <ResultRow
                      key={doc.id}
                      icon="📄"
                      title={doc.title}
                      badge={doc.folder}
                      isSelected={selectedIndex === getResultIndex('document', idx)}
                      onClick={() => navigateTo('document', doc)}
                      onHover={() => setSelectedIndex(getResultIndex('document', idx))}
                    />
                  ))}
                </div>
              )}

              {/* Pipeline */}
              {results.pipeline.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Pipeline
                  </div>
                  {results.pipeline.map((app, idx) => (
                    <ResultRow
                      key={app.id}
                      icon={app.emoji}
                      title={app.name}
                      badge={PHASE_LABELS[app.phase] || app.phase}
                      isSelected={selectedIndex === getResultIndex('pipeline', idx)}
                      onClick={() => navigateTo('pipeline', app)}
                      onHover={() => setSelectedIndex(getResultIndex('pipeline', idx))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Initial state */}
          {!isLoading && query.length < 2 && (
            <div className="px-4 py-8 text-center text-slate-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type ResultRowProps = {
  icon: string
  title: string
  subtitle?: string
  badge?: string
  isSelected: boolean
  onClick: () => void
  onHover: () => void
}

function ResultRow({ icon, title, subtitle, badge, isSelected, onClick, onHover }: ResultRowProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isSelected ? 'bg-slate-700/70' : 'hover:bg-slate-800/50'
      }`}
    >
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-100 truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</div>
        )}
      </div>
      {badge && (
        <span className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300 shrink-0">
          {badge}
        </span>
      )}
      <ArrowRight
        size={14}
        className={`text-slate-500 shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
      />
    </button>
  )
}
