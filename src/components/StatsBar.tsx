'use client'

import { Task } from '@/lib/types'
import { CheckCircle2, PlayCircle, Eye } from 'lucide-react'

interface StatsBarProps {
  tasks: Task[]
}

export function StatsBar({ tasks }: StatsBarProps) {
  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    inReview: tasks.filter(t => t.status === 'review').length
  }

  const cards = [
    { 
      label: 'Total Tasks', 
      value: stats.total, 
      icon: <CheckCircle2 size={18} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress, 
      icon: <PlayCircle size={18} />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      label: 'In Review', 
      value: stats.inReview, 
      icon: <Eye size={18} />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    { 
      label: 'Completed', 
      value: stats.done, 
      icon: <CheckCircle2 size={18} />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      {cards.map((card, i) => (
        <div 
          key={i}
          className="bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700 flex items-center gap-2 md:gap-3"
        >
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${card.bgColor} flex items-center justify-center ${card.color}`}>
            {card.icon}
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-100">{card.value}</p>
            <p className="text-[10px] md:text-xs text-slate-400">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
