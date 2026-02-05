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
  createdFrom?: string // Source identifier (e.g., audit item ID)
}

export type Activity = {
  id: string
  task_id: string | null
  action: string
  actor: 'dj' | 'larry'
  timestamp: string
}

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start: string // ISO datetime
  end: string | null // ISO datetime (null = all day or no end time)
  all_day: boolean
  location: string | null
  color: string // hex color for display
  category: 'family' | 'work' | 'personal' | 'health' | 'social' | 'other'
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder: number | null // minutes before event
  created_at: string
  updated_at: string
}

export type Document = {
  id: string
  title: string
  content: string // Markdown content
  folder: string
  author: 'dj' | 'larry'
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  name: string
  emoji: string
  color: string
}

export const PROJECTS: Project[] = [
  // Development Projects
  { id: 'clayboss', name: 'Clayboss', emoji: '🏺', color: '#a855f7' },
  { id: 'poker-sesh', name: 'Poker Sesh', emoji: '🎴', color: '#3b82f6' },
  { id: 'sticker-app', name: 'Sticker App', emoji: '🎨', color: '#eab308' },
  { id: 'mission-control', name: 'Mission Control', emoji: '🦝', color: '#22c55e' },
  
  // Life & Family
  { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦', color: '#ef4444' },
  { id: 'home', name: 'Home Projects', emoji: '🏠', color: '#f97316' },
  { id: 'health', name: 'Health & Wellness', emoji: '💪', color: '#14b8a6' },
  { id: 'finance', name: 'Finances', emoji: '💰', color: '#eab308' },
  
  // Personal Growth
  { id: 'learning', name: 'Learning', emoji: '📚', color: '#8b5cf6' },
  { id: 'career', name: 'Career Development', emoji: '💼', color: '#6366f1' },
  
  // Admin & Planning
  { id: 'planning', name: 'Planning & Goals', emoji: '🎯', color: '#ec4899' },
  { id: 'admin', name: 'Admin & Logistics', emoji: '📋', color: '#64748b' },
]
