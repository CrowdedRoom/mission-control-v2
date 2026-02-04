'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { Task, Activity } from '@/lib/types'
import { KanbanColumn } from '@/components/KanbanColumn'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'
import { ActivityFeed } from '@/components/ActivityFeed'
import { StatsBar } from '@/components/StatsBar'
import { Plus, RefreshCw } from 'lucide-react'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', emoji: '📥', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', emoji: '🔨', color: '#3b82f6' },
  { id: 'review', title: 'Review', emoji: '👀', color: '#a855f7' },
  { id: 'done', title: 'Done', emoji: '✅', color: '#22c55e' }
]

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string>('backlog')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeDragTask, _setActiveDragTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [tasksRes, activityRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/activity')
      ])
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }
      
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setActivities(activityData)
      }
      
      setLastSync(new Date())
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as Task['status']
    
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    // API call
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, updated_by: 'dj' })
      })
      
      // Refresh activities
      const activityRes = await fetch('/api/activity')
      if (activityRes.ok) {
        setActivities(await activityRes.json())
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === taskId ? task : t
      ))
    }
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update existing
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskData, updated_by: 'dj' })
        })
        
        if (res.ok) {
          const updated = await res.json()
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
        }
      } else {
        // Create new
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taskData, created_by: 'dj' })
        })
        
        if (res.ok) {
          const created = await res.json()
          setTasks(prev => [created, ...prev])
        }
      }
      
      // Refresh activities
      const activityRes = await fetch('/api/activity')
      if (activityRes.ok) {
        setActivities(await activityRes.json())
      }
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const openAddModal = (columnId: string) => {
    setActiveColumn(columnId)
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const getTasksByStatus = (status: string) => 
    tasks.filter(t => t.status === status)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          Loading Mission Control...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦝</span>
            <div>
              <h1 className="text-xl font-bold">Mission Control Dashboard</h1>
              <p className="text-sm text-slate-400">DJ White & Larry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Last synced: {lastSync.toLocaleTimeString()}</span>
            <button
              onClick={loadData}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <StatsBar tasks={tasks} />

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => openAddModal('backlog')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                emoji={column.emoji}
                color={column.color}
                tasks={getTasksByStatus(column.id)}
                onEdit={openEditModal}
                onDelete={handleDeleteTask}
                onAdd={() => openAddModal(column.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <TaskCard
                task={activeDragTask}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Activity Feed */}
        <div className="mt-8">
          <ActivityFeed activities={activities} />
        </div>
      </main>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={activeColumn}
      />
    </div>
  )
}
