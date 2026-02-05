'use client'

import { useState } from 'react'
import { Brain, Loader, CheckCircle, Calendar, FileText, ListTodo } from 'lucide-react'

type ProcessedItem = {
  type: 'task' | 'event' | 'note'
  title: string
  details?: string
  status: 'success' | 'error'
}

export default function CapturePage() {
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessedItem[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setProcessing(true)
    setResults([])

    try {
      const res = await fetch('/api/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, user: 'dj' })
      })

      if (res.ok) {
        const data = await res.json()
        setResults(data.processed || [])
        setInput('') // Clear input after successful processing
      } else {
        console.error('Failed to process brain dump')
      }
    } catch (error) {
      console.error('Error processing brain dump:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <ListTodo size={16} className="text-blue-400" />
      case 'event': return <Calendar size={16} className="text-purple-400" />
      case 'note': return <FileText size={16} className="text-emerald-400" />
      default: return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Task'
      case 'event': return 'Event'
      case 'note': return 'Note'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={32} className="text-purple-400" />
            <h1 className="text-3xl font-bold text-slate-100">Brain Dump</h1>
          </div>
          <p className="text-slate-400">
            Pour out your thoughts. I&apos;ll sort them into tasks, events, and notes.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            What&apos;s on your mind?
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Just type whatever... I&apos;ll figure it out.

Examples:
- Need to call dentist tomorrow at 2pm
- Task: Review pottery app designs
- Remember: Teresa&apos;s birthday is March 15th
- Idea for new feature: drag and drop file uploads"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={12}
            disabled={processing}
          />
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-400">
              {input.length > 0 && `${input.length} characters`}
            </span>
            <button
              type="submit"
              disabled={!input.trim() || processing}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
            >
              {processing ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Process
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Processed {results.length} {results.length === 1 ? 'item' : 'items'}
              </h2>
            </div>

            <div className="space-y-3">
              {results.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg"
                >
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-400 uppercase">
                        {getTypeLabel(item.type)}
                      </span>
                      {item.status === 'success' && (
                        <span className="text-xs text-green-400">✓ Created</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-xs text-red-400">✗ Failed</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 font-medium">{item.title}</p>
                    {item.details && (
                      <p className="text-xs text-slate-400 mt-1">{item.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-2">💡 Tips</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Start lines with &quot;task:&quot; or &quot;todo:&quot; for action items</li>
            <li>• Include dates/times for calendar events</li>
            <li>• Everything else becomes a note in your Second Brain</li>
            <li>• Just type naturally — I&apos;ll figure it out</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
