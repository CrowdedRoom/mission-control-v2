'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Clock, Pin, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import type { MemoryFile } from '@/app/api/memories/route'

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryFile[]>([])
  const [selected, setSelected] = useState<MemoryFile | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const fetchMemories = useCallback(async (q?: string) => {
    try {
      const url = q ? `/api/memories?q=${encodeURIComponent(q)}` : '/api/memories'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMemories(data.memories ?? [])
        if (!selected && data.memories?.length > 0) {
          setSelected(data.memories[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err)
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => {
    fetchMemories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      fetchMemories(value)
    }, 300)
    setSearchTimer(timer)
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Left Panel — File List */}
      <div className="w-72 shrink-0 border-r border-slate-700 bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-slate-100 mb-3">🧠 Memory</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="px-3 space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-slate-800 rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-full mb-1" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <FileText size={32} className="text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No memories found</p>
              {query && (
                <p className="text-slate-500 text-xs mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <div className="px-2 space-y-1">
              {memories.map(mem => (
                <button
                  key={mem.id}
                  onClick={() => setSelected(mem)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border-l-2 ${
                    selected?.id === mem.id
                      ? 'bg-slate-700 border-blue-500'
                      : 'bg-transparent border-transparent hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {mem.pinned && <Pin size={11} className="text-yellow-400 shrink-0" />}
                    <span className="text-sm font-medium text-slate-100 truncate">
                      {mem.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-1.5">
                    {mem.preview || '(empty)'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(mem.updatedAt), { addSuffix: true })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && memories.length > 0 && (
          <div className="p-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              {memories.length} file{memories.length !== 1 ? 's' : ''}
              {query && ` matching "${query}"`}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel — Content */}
      <div className="flex-1 overflow-y-auto bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400 text-sm">Loading memories...</div>
          </div>
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-4">🧠</span>
            <p className="text-slate-300 font-medium">Select a memory file</p>
            <p className="text-slate-500 text-sm mt-1">
              {memories.length} file{memories.length !== 1 ? 's' : ''} in memory
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-6 md:p-8">
            {/* File header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {selected.pinned && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      📌 Index
                    </span>
                  )}
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {selected.filename}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock size={11} />
                  Updated {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Markdown content */}
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-slate-100 
              prose-p:text-slate-300 
              prose-strong:text-slate-100
              prose-code:text-blue-300 
              prose-code:bg-slate-800 
              prose-code:px-1.5
              prose-code:py-0.5
              prose-code:rounded
              prose-code:before:content-none
              prose-code:after:content-none
              prose-pre:bg-slate-800 
              prose-pre:border 
              prose-pre:border-slate-700
              prose-a:text-blue-400 
              prose-a:no-underline
              hover:prose-a:underline
              prose-blockquote:border-slate-600 
              prose-blockquote:text-slate-400
              prose-ul:text-slate-300
              prose-ol:text-slate-300
              prose-li:text-slate-300
              prose-hr:border-slate-700
              prose-table:text-slate-300
              prose-th:text-slate-200
              prose-td:text-slate-300
            ">
              <ReactMarkdown>{selected.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
