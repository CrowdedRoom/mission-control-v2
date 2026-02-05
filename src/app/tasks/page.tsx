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
import { Plus, RefreshCw, CheckCircle, X } from 'lucide-react'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', emoji: '📥', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', emoji: '🔨', color: '#3b82f6' },
  { id: 'review', title: 'Review', emoji: '👀', color: '#a855f7' },
  { id: 'done', title: 'Done', emoji: '✅', color: '#22c55e' }
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string>('backlog')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeDragTask, _setActiveDragTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [importedTaskIds, setImportedTaskIds] = useState<Set<string>>(new Set())
  const [importBanner, setImportBanner] = useState<{ show: boolean; count: number }>({ show: false, count: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    loadData()
  }, [])

  // Check for tasks to import from audit page
  useEffect(() => {
    const importTasksFromSession = async () => {
      const stored = sessionStorage.getItem('tasksToCreate')
      if (!stored) return

      try {
        const tasksToImport = JSON.parse(stored)
        if (!Array.isArray(tasksToImport) || tasksToImport.length === 0) return

        // Clear sessionStorage immediately to prevent duplicate imports
        sessionStorage.removeItem('tasksToCreate')

        const createdIds: string[] = []
        const taskMap: Record<string, string> = {} // audit_id -> task_id

        // Create tasks via API
        for (const task of tasksToImport) {
          // Map numeric priority (1, 2, 3) to string priority ('high', 'medium', 'low')
          const priorityMap: { [key: number]: string } = {
            1: 'high',
            2: 'medium',
            3: 'low'
          }
          const mappedPriority = priorityMap[task.priority] || 'medium'

          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description || null,
              project: task.project,
              priority: mappedPriority,
              status: 'backlog', // Map 'todo' to 'backlog'
              createdFrom: task.createdFrom,
              created_by: 'dj'
            })
          })

          if (res.ok) {
            const created = await res.json()
            createdIds.push(created.id)
            setTasks(prev => [created, ...prev])
            
            // Track mapping for audit page
            if (task.createdFrom) {
              taskMap[task.createdFrom] = created.id
            }
          }
        }

        if (createdIds.length > 0) {
          setImportedTaskIds(new Set(createdIds))
          setImportBanner({ show: true, count: createdIds.length })

          // Send task IDs back to audit page
          if (Object.keys(taskMap).length > 0) {
            sessionStorage.setItem('createdTaskIds', JSON.stringify(taskMap))
          }

          // Refresh activities
          const activityRes = await fetch('/api/activity')
          if (activityRes.ok) {
            setActivities(await activityRes.json())
          }

          // Clear highlight after 10 seconds
          setTimeout(() => {
            setImportedTaskIds(new Set())
          }, 10000)
        }
      } catch (error) {
        console.error('Failed to import tasks from audit:', error)
      }
    }

    // Only run after initial data load
    if (!isLoading) {
      importTasksFromSession()
    }
  }, [isLoading])

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
    const validColumns = COLUMNS.map(c => c.id)
    const overId = over.id as string
    let newStatus: Task['status']

    if (validColumns.includes(overId)) {
      newStatus = overId as Task['status']
    } else {
      // Dropped on a task — use that task's status
      const overTask = tasks.find(t => t.id === overId)
      if (!overTask) return
      newStatus = overTask.status
    }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          Loading Tasks...
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <header className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100">Tasks</h1>
          <p className="text-xs md:text-sm text-slate-400">Track and manage everything we need to do</p>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <span className="text-xs md:text-sm text-slate-400 hidden sm:inline">
            Last synced: {lastSync.toLocaleTimeString()}
          </span>
          <button
            onClick={loadData}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <StatsBar tasks={tasks} />

      {/* Quick Actions */}
      <div className="flex gap-3 mb-4 md:mb-6">
        <button
          onClick={() => openAddModal('backlog')}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors text-sm md:text-base"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 min-w-[600px] lg:min-w-0">
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
        </div>

        {/* Activity Feed - Hidden on mobile */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <ActivityFeed activities={activities} />
        </div>
      </div>

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
