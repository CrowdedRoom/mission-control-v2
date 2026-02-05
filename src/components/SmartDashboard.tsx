'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task, PROJECTS } from '@/lib/types'
import { TrendingUp, AlertCircle, Zap, Clock } from 'lucide-react'
import { subDays, isAfter, parseISO } from 'date-fns'

interface SmartDashboardProps {
  tasks: Task[]
}

interface ProjectHealth {
  id: string
  name: string
  emoji: string
  color: string
  status: 'active' | 'slow' | 'stuck' | 'complete'
  lastActivity: Date | null
  openTasks: number
  inReview: number
  completedThisWeek: number
  recommendation: string
}

export function SmartDashboard({ tasks }: SmartDashboardProps) {
  const [velocity, setVelocity] = useState({ thisWeek: 0, lastWeek: 0, trend: 0 })
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])

  const calculateVelocity = useCallback(() => {
    const now = new Date()
    const weekAgo = subDays(now, 7)
    const twoWeeksAgo = subDays(now, 14)

    const thisWeek = tasks.filter(t => {
      const updated = parseISO(t.updated_at)
      return t.status === 'done' && isAfter(updated, weekAgo)
    }).length

    const lastWeek = tasks.filter(t => {
      const updated = parseISO(t.updated_at)
      return t.status === 'done' && isAfter(updated, twoWeeksAgo) && !isAfter(updated, weekAgo)
    }).length

    const trend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0

    setVelocity({ thisWeek, lastWeek, trend })
  }, [tasks])

  const calculateProjectHealth = useCallback(() => {
    // Group tasks by project
    const projects: { [key: string]: Task[] } = {}
    tasks.forEach(task => {
      if (!projects[task.project]) projects[task.project] = []
      projects[task.project].push(task)
    })

    const health: ProjectHealth[] = Object.entries(projects).map(([projectId, projectTasks]) => {
      const project = PROJECTS.find((p) => p.id === projectId)
      
      const open = projectTasks.filter(t => t.status !== 'done').length
      const inReview = projectTasks.filter(t => t.status === 'review').length
      const done = projectTasks.filter(t => t.status === 'done').length
      const completedThisWeek = projectTasks.filter(t => {
        const updated = parseISO(t.updated_at)
        return t.status === 'done' && isAfter(updated, subDays(new Date(), 7))
      }).length

      const lastUpdate = projectTasks
        .map(t => parseISO(t.updated_at))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null

      const daysSinceActivity = lastUpdate 
        ? Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      let status: 'active' | 'slow' | 'stuck' | 'complete' = 'active'
      let recommendation = ''

      if (done === projectTasks.length) {
        status = 'complete'
        recommendation = '✅ Complete'
      } else if (inReview > 2) {
        status = 'stuck'
        recommendation = `⚠️ ${inReview} tasks stuck in review`
      } else if (daysSinceActivity && daysSinceActivity > 5) {
        status = 'slow'
        recommendation = `😴 No activity in ${daysSinceActivity} days`
      } else if (completedThisWeek === 0 && open > 0) {
        status = 'slow'
        recommendation = '📉 No progress this week'
      } else {
        recommendation = `✨ ${completedThisWeek} completed this week`
      }

      return {
        id: projectId,
        name: project?.name || projectId,
        emoji: project?.emoji || '📦',
        color: project?.color || '#64748b',
        status,
        lastActivity: lastUpdate,
        openTasks: open,
        inReview,
        completedThisWeek,
        recommendation
      }
    })

    // Sort by priority: stuck > slow > active
    health.sort((a, b) => {
      const priority = { stuck: 0, slow: 1, active: 2, complete: 3 }
      return priority[a.status] - priority[b.status]
    })

    setProjectHealth(health)

    // Generate recommendations
    const recs: string[] = []
    if (velocity.trend > 0) recs.push(`🚀 You're accelerating! ${velocity.trend}% more tasks this week`)
    if (velocity.trend < 0) recs.push(`📉 Pace slowed by ${Math.abs(velocity.trend)}%. Consider picking a focus`)
    
    const stuck = health.filter(p => p.status === 'stuck')
    if (stuck.length > 0) {
      recs.push(`⚠️ ${stuck.map(p => p.emoji).join(' ')} ${stuck.map(p => p.name).join(', ')} — tasks stuck in review`)
    }

    const focus = health.find(p => p.status === 'active' && p.completedThisWeek > 0)
    if (focus) {
      recs.push(`✨ Focus: Keep momentum on ${focus.emoji} ${focus.name}`)
    }

    setRecommendations(recs)
  }, [tasks, velocity.trend])

  useEffect(() => {
    calculateVelocity()
    calculateProjectHealth()
  }, [calculateVelocity, calculateProjectHealth])

  return (
    <div className="space-y-6">
      {/* Velocity & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">This Week</p>
              <p className="text-3xl font-bold text-slate-100">{velocity.thisWeek}</p>
              <p className="text-xs text-slate-500">tasks completed</p>
            </div>
            <Zap className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Last Week</p>
              <p className="text-3xl font-bold text-slate-100">{velocity.lastWeek}</p>
              <p className="text-xs text-slate-500">tasks completed</p>
            </div>
            <Clock className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Momentum</p>
              <p className={`text-3xl font-bold ${velocity.trend > 0 ? 'text-green-400' : velocity.trend < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {velocity.trend > 0 ? '+' : ''}{velocity.trend}%
              </p>
              <p className="text-xs text-slate-500">vs last week</p>
            </div>
            <TrendingUp className={velocity.trend > 0 ? 'text-green-400' : 'text-slate-400'} size={32} />
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-blue-600/30">
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            Smart Insights
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <p key={i} className="text-sm text-slate-300">{rec}</p>
            ))}
          </div>
        </div>
      )}

      {/* Project Health */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Project Status</h3>
        <div className="space-y-2">
          {projectHealth.map(project => (
            <div 
              key={project.id}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{project.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{project.name}</p>
                  <p className="text-xs text-slate-400">{project.recommendation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {project.status === 'stuck' && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">⚠️ Stuck</span>}
                {project.status === 'slow' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">😴 Slow</span>}
                {project.status === 'active' && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">✨ Active</span>}
                {project.status === 'complete' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">✅ Done</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
