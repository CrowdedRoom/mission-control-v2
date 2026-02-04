export type Task = {
  id: string
  title: string
  description: string | null
  status: 'backlog' | 'in_progress' | 'review' | 'done'
  assignee: 'dj' | 'larry' | null
  project: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export type Activity = {
  id: string
  task_id: string | null
  action: string
  actor: 'dj' | 'larry'
  timestamp: string
}

export type Project = {
  id: string
  name: string
  emoji: string
  color: string
}

export const PROJECTS: Project[] = [
  { id: 'clayboss', name: 'Clayboss', emoji: '🏺', color: '#a855f7' },
  { id: 'poker-sesh', name: 'Poker Sesh', emoji: '🎴', color: '#3b82f6' },
  { id: 'sticker-app', name: 'Sticker App', emoji: '🎨', color: '#eab308' },
  { id: 'mission-control', name: 'Mission Control', emoji: '🦝', color: '#22c55e' },
]
