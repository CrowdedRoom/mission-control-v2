'use client'

import { useState, useEffect } from 'react'
import { Task, PROJECTS } from '@/lib/types'
import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        setTasks(await res.json())
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project === projectId)
    return {
      total: projectTasks.length,
      done: projectTasks.filter(t => t.status === 'done').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      open: projectTasks.filter(t => t.status !== 'done').length
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Projects</h1>
        <p className="text-slate-400">Overview of all our active work streams.</p>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map(project => {
          const stats = getProjectStats(project.id)
          const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
          
          return (
            <div 
              key={project.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{project.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-slate-100">{project.name}</h3>
                    <p className="text-xs text-slate-400">{stats.open} open tasks</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: project.color 
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <span className="text-slate-400">
                  <span className="text-yellow-400">{stats.inProgress}</span> in progress
                </span>
                <span className="text-slate-400">
                  <span className="text-green-400">{stats.done}</span> done
                </span>
              </div>

              {/* Action */}
              <Link
                href={`/tasks?project=${project.id}`}
                className="flex items-center justify-center gap-2 w-full py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                View Tasks
                <ArrowRight size={16} />
              </Link>
            </div>
          )
        })}

        {/* Add New Project Card */}
        <button className="bg-slate-800/50 rounded-xl p-6 border border-dashed border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-slate-300 min-h-[200px]">
          <Plus size={32} className="mb-2" />
          <span className="font-medium">New Project</span>
          <span className="text-sm">Coming soon</span>
        </button>
      </div>
    </div>
  )
}
