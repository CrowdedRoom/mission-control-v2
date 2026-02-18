'use client'

import { Task, PROJECTS } from '@/lib/types'
import { X, Pencil, Trash2, Calendar, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskDetailModal({ task, isOpen, onClose, onEdit, onDelete }: TaskDetailModalProps) {
  if (!isOpen || !task) return null

  const project = PROJECTS.find(p => p.id === task.project)

  const getPriorityString = (priority: string | number): string => {
    if (typeof priority === 'number') {
      const map: { [key: number]: string } = { 1: 'high', 2: 'medium', 3: 'low' }
      return map[priority] || 'medium'
    }
    return priority as string
  }

  const priorityString = getPriorityString(task.priority)

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  }

  const statusStyles: Record<string, string> = {
    backlog: 'bg-slate-500/20 text-slate-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    review: 'bg-purple-500/20 text-purple-400',
    done: 'bg-green-500/20 text-green-400',
  }

  const statusLabels: Record<string, string> = {
    backlog: '📥 Backlog',
    in_progress: '🔨 In Progress',
    review: '👀 Review',
    done: '✅ Done',
  }

  const assigneeLabel = task.assignee === 'dj' ? '👤 DJ' : task.assignee === 'larry' ? '🦝 Larry' : null

  const handleDelete = () => {
    onClose()
    onDelete(task.id)
  }

  const handleEdit = () => {
    onClose()
    onEdit(task)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-800 rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100 leading-snug">{task.title}</h2>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {project && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  {project.emoji} {project.name}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[priorityString] ?? ''}`}>
                ● {priorityString.charAt(0).toUpperCase() + priorityString.slice(1)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[task.status] ?? ''}`}>
                {statusLabels[task.status] ?? task.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-slate-700 text-xs text-slate-400">
          {assigneeLabel && (
            <span className="flex items-center gap-1">
              <User size={12} /> {assigneeLabel}
            </span>
          )}
          {task.created_at && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Created {new Date(task.created_at).toLocaleDateString()}
            </span>
          )}
          {task.updated_at && task.updated_at !== task.created_at && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Updated {new Date(task.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="flex-1 overflow-y-auto p-5">
          {task.description ? (
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-slate-100 prose-headings:font-semibold
              prose-h2:text-base prose-h3:text-sm
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300
              prose-strong:text-slate-100
              prose-code:text-blue-300 prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
              prose-a:text-blue-400 hover:prose-a:text-blue-300
              prose-hr:border-slate-700
              prose-blockquote:border-slate-600 prose-blockquote:text-slate-400
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {task.description}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-500 italic text-sm">No description.</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}
