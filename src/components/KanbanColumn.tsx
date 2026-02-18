'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task } from '@/lib/types'
import { TaskCard } from './TaskCard'
import { Plus } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  emoji: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onView: (task: Task) => void
  onAdd: () => void
  color: string
}

export function KanbanColumn({ 
  id, 
  title, 
  emoji, 
  tasks, 
  onEdit,
  onDelete,
  onView,
  onAdd,
  color 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-slate-800/50 rounded-xl p-4 min-h-[500px] flex flex-col border-t-4 ${isOver ? 'bg-slate-800' : ''}`}
      style={{ borderTopColor: color }}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </SortableContext>
      </div>

      <button
        onClick={onAdd}
        className="mt-3 w-full py-2 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <Plus size={16} />
        Add task
      </button>
    </div>
  )
}
