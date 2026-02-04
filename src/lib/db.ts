import { promises as fs } from 'fs'
import { join } from 'path'
import { Task, Activity } from './types'

const DB_PATH = join(process.cwd(), 'data', 'db.json')

type Database = {
  tasks: Task[]
  activity: Activity[]
}

const defaultDb: Database = {
  tasks: [],
  activity: []
}

async function ensureDb(): Promise<void> {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })
    await fs.access(DB_PATH)
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2))
  }
}

async function readDb(): Promise<Database> {
  await ensureDb()
  const data = await fs.readFile(DB_PATH, 'utf-8')
  return JSON.parse(data)
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
}

export async function getTasks(): Promise<Task[]> {
  const db = await readDb()
  return db.tasks.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await readDb()
  return db.tasks.find(t => t.id === id) || null
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const db = await readDb()
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  db.tasks.push(newTask)
  await writeDb(db)
  return newTask
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const db = await readDb()
  const index = db.tasks.findIndex(t => t.id === id)
  if (index === -1) return null
  
  db.tasks[index] = {
    ...db.tasks[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  await writeDb(db)
  return db.tasks[index]
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await readDb()
  const index = db.tasks.findIndex(t => t.id === id)
  if (index === -1) return false
  
  db.tasks.splice(index, 1)
  await writeDb(db)
  return true
}

export async function getActivity(): Promise<Activity[]> {
  const db = await readDb()
  return db.activity.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export async function logActivity(action: string, actor: 'dj' | 'larry', taskId?: string): Promise<Activity> {
  const db = await readDb()
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    task_id: taskId || null,
    action,
    actor,
    timestamp: new Date().toISOString()
  }
  db.activity.push(newActivity)
  
  // Keep only last 100 activities
  if (db.activity.length > 100) {
    db.activity = db.activity.slice(-100)
  }
  
  await writeDb(db)
  return newActivity
}
