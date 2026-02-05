'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface NewProjectModalProps {
  onClose: () => void
  onProjectCreated: () => void
}

const EMOJI_OPTIONS = [
  '🦝', '🎨', '🏺', '🎴', '📱', '💻', '🚀', '⚡', '🔥', '💡',
  '👨‍👩‍👧‍👦', '🏠', '💪', '💰', '📚', '💼', '🎯', '📋', '🎮', '🎬',
  '🎵', '🍕', '☕', '🌟', '🔧', '🎉', '📊', '🗂️', '📝', '🎪'
]

const COLOR_OPTIONS = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Slate', value: '#64748b' },
]

export function NewProjectModal({ onClose, onProjectCreated }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [color, setColor] = useState('#64748b')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), emoji, color })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      onProjectCreated()
      onClose()
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mobile App Rewrite"
              disabled={saving}
              required
            />
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Emoji
            </label>
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    emoji === em
                      ? 'bg-blue-600 scale-110'
                      : 'bg-slate-900 hover:bg-slate-700'
                  }`}
                  disabled={saving}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-12 rounded-lg transition-all ${
                    color === c.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  disabled={saving}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2">Preview</div>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: color + '20' }}
              >
                {emoji}
              </div>
              <div className="text-slate-100 font-medium">
                {name || 'Project Name'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
