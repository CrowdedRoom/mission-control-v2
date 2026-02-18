'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, PROJECTS } from '@/lib/types'
import { GripVertical, Pencil, Trash2, Eye } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onView: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete, onView }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const project = PROJECTS.find(p => p.id === task.project)
  
  // Convert numeric priority (1,2,3) to string priority (high,medium,low)
  const getPriorityString = (priority: string | number): string => {
    if (typeof priority === 'number') {
      const numericMap: { [key: number]: string } = { 1: 'high', 2: 'medium', 3: 'low' }
      return numericMap[priority] || 'medium'
    }
    return priority as string
  }
  
  const priorityString = getPriorityString(task.priority) as 'low' | 'medium' | 'high'
  
  const priorityColors: Record<'low' | 'medium' | 'high', string> = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400'
  }

  const priorityIndicators: Record<'low' | 'medium' | 'high', string> = {
    low: '● Low',
    medium: '● Medium',
    high: '● High'
  }

  const assigneeEmojis = {
    dj: '👤',
    larry: '🦝'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-700 rounded-lg p-3 mb-3 group relative border border-transparent hover:border-blue-500/50 transition-all"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-200"
        >
          <GripVertical size={16} />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ 
                backgroundColor: `${project?.color}20`,
                color: project?.color 
              }}
            >
              {project?.emoji} {project?.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[priorityString]}`}>
              {priorityIndicators[priorityString]}
            </span>
          </div>
          
          <h4
            className="text-sm font-medium text-slate-100 mb-1 line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={() => onView(task)}
          >
            {task.title}
          </h4>
          
          {task.description && (
            <p
              className="text-xs text-slate-400 line-clamp-2 mb-2 cursor-pointer hover:text-slate-300 transition-colors"
              onClick={() => onView(task)}
            >
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {task.assignee && (
              <span className="text-sm" title={task.assignee === 'dj' ? 'DJ' : 'Larry'}>
                {assigneeEmojis[task.assignee]}
              </span>
            )}
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onView(task)}
                className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-blue-400"
                title="View"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-slate-200"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
