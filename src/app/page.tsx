'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Task, Activity, PROJECTS } from '@/lib/types'
import { ActivityFeed } from '@/components/ActivityFeed'
import { 
  CheckCircle2, 
  PlayCircle, 
  Eye,
  ArrowRight,
  Calendar,
  FileText,
  CheckSquare
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksRes, activityRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/activity')
      ])
      
      if (tasksRes.ok) {
        setTasks(await tasksRes.json())
      }
      
      if (activityRes.ok) {
        setActivities(await activityRes.json())
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    inReview: tasks.filter(t => t.status === 'review').length,
    backlog: tasks.filter(t => t.status === 'backlog').length
  }

  const priorityTasks = tasks
    .filter(t => t.priority === 'high' && t.status !== 'done')
    .slice(0, 5)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon={<CheckCircle2 size={20} />}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
          href="/tasks"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<PlayCircle size={20} />}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          href="/tasks"
        />
        <StatCard
          label="In Review"
          value={stats.inReview}
          icon={<Eye size={20} />}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          href="/tasks"
        />
        <StatCard
          label="Completed"
          value={stats.done}
          icon={<CheckCircle2 size={20} />}
          color="text-green-400"
          bgColor="bg-green-500/10"
          href="/tasks"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* High Priority Tasks */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">🔥 High Priority</h2>
              <Link 
                href="/tasks" 
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            
            {priorityTasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No high priority tasks. Nice!</p>
            ) : (
              <div className="space-y-3">
                {priorityTasks.map(task => {
                  const project = PROJECTS.find(p => p.id === task.project)
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg"
                    >
                      <span className="text-red-400">🔴</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">{task.title}</p>
                        <p className="text-xs text-slate-400">
                          {project?.emoji} {project?.name} • {task.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">📊 Recent Activity</h2>
            <ActivityFeed activities={activities.slice(0, 5)} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Quick Links</h2>
            <div className="space-y-2">
              <QuickLink 
                href="/tasks" 
                icon={<CheckSquare size={18} />}
                label="View All Tasks"
                count={stats.backlog}
              />
              <QuickLink 
                href="/projects" 
                icon={<PlayCircle size={18} />}
                label="Projects Overview"
              />
              <QuickLink 
                href="/calendar" 
                icon={<Calendar size={18} />}
                label="Calendar"
              />
              <QuickLink 
                href="/docs" 
                icon={<FileText size={18} />}
                label="Documents"
              />
            </div>
          </div>

          {/* Projects Status */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Projects</h2>
            <div className="space-y-3">
              {PROJECTS.slice(0, 6).map(project => {
                const count = tasks.filter(t => t.project === project.id && t.status !== 'done').length
                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{project.emoji}</span>
                      <span className="text-sm text-slate-300">{project.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {count > 0 ? `${count} open` : '✓'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's Date */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-3xl font-bold text-slate-100">
              {format(new Date(), 'MMM d')}
            </p>
            <p className="text-slate-400">{format(new Date(), 'EEEE, yyyy')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  bgColor,
  href 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
  href: string
}) {
  return (
    <Link href={href}>
      <div className={`${bgColor} rounded-xl p-4 border border-slate-700 flex items-center gap-3 hover:border-slate-600 transition-colors`}>
        <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </Link>
  )
}

function QuickLink({ 
  href, 
  icon, 
  label,
  count
}: { 
  href: string
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors group"
    >
      <span className="text-slate-400 group-hover:text-slate-300">{icon}</span>
      <span className="text-sm text-slate-300 flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
      <ArrowRight size={14} className="text-slate-500 group-hover:text-slate-300" />
    </Link>
  )
}
