'use client'

import { Activity } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { GitCommit, CheckCircle2, Plus, Play, Eye } from 'lucide-react'

interface ActivityFeedProps {
  activities: Activity[]
}

const activityIcons: Record<string, React.ReactNode> = {
  'created': <Plus size={14} />,
  'completed': <CheckCircle2 size={14} />,
  'started': <Play size={14} />,
  'submitted': <Eye size={14} />,
  'moved': <GitCommit size={14} />,
  'default': <GitCommit size={14} />
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Recent Activity
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
        ) : (
          activities.map(activity => {
            const actorEmoji = activity.actor === 'dj' ? '👤' : '🦝'
            const iconKey = Object.keys(activityIcons).find(k => 
              activity.action.toLowerCase().includes(k)
            ) || 'default'
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                  {activityIcons[iconKey]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">
                    <span className="font-medium">{actorEmoji} {activity.actor === 'dj' ? 'DJ' : 'Larry'}</span>
                    {' '}{activity.action?.replace(/undefined/g, '').replace(/\s+/g, ' ').trim() || 'unknown action'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
