'use client'

import { MessageCircle, Calendar } from 'lucide-react'

const TEAM = [
  {
    name: 'DJ White',
    role: 'Product Owner',
    emoji: '👤',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    name: 'Larry',
    role: 'AI Assistant',
    emoji: '🦝',
    status: 'online',
    lastSeen: 'Always on'
  }
]

export default function TeamPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Team</h1>
        <p className="text-slate-400">The people behind Mission Control.</p>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {TEAM.map(member => (
          <div 
            key={member.name}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{member.emoji}</span>
                <div>
                  <h3 className="font-semibold text-slate-100">{member.name}</h3>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span className="text-xs text-slate-400">{member.status}</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-4">{member.lastSeen}</p>

            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">
                <MessageCircle size={16} />
                Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors">
                <Calendar size={16} />
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Collaboration Stats */}
      <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Collaboration Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Tasks Created" value="12" />
          <Stat label="Tasks Completed" value="3" />
          <Stat label="Documents" value="3" />
          <Stat label="Days Active" value="2" />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center p-4 bg-slate-700/50 rounded-lg">
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  )
}
