import { promises as fs } from 'fs'
import { join } from 'path'
import { Task, Activity, CalendarEvent, Document, Project } from './types'

const DB_PATH = join(process.cwd(), 'data', 'db.json')

type Database = {
  tasks: Task[]
  activity: Activity[]
  events: CalendarEvent[]
  documents: Document[]
  projects: Project[]
}

const defaultDb: Database = {
  tasks: [],
  activity: [],
  events: [],
  documents: [],
  projects: []
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

// Calendar Events
export async function getEvents(): Promise<CalendarEvent[]> {
  const db = await readDb()
  return (db.events || []).sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )
}

export async function getEventsByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  const events = await getEvents()
  return events.filter(event => {
    const eventStart = new Date(event.start)
    const eventEnd = event.end ? new Date(event.end) : eventStart
    return eventStart <= end && eventEnd >= start
  })
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const db = await readDb()
  return (db.events || []).find(e => e.id === id) || null
}

export async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  const db = await readDb()
  if (!db.events) db.events = []
  
  const newEvent: CalendarEvent = {
    ...event,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  db.events.push(newEvent)
  await writeDb(db)
  return newEvent
}

export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  const db = await readDb()
  if (!db.events) db.events = []
  
  const index = db.events.findIndex(e => e.id === id)
  if (index === -1) return null
  
  db.events[index] = {
    ...db.events[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  await writeDb(db)
  return db.events[index]
}

export async function deleteEvent(id: string): Promise<boolean> {
  const db = await readDb()
  if (!db.events) return false
  
  const index = db.events.findIndex(e => e.id === id)
  if (index === -1) return false
  
  db.events.splice(index, 1)
  await writeDb(db)
  return true
}

// Documents
export async function getDocuments(): Promise<Document[]> {
  const db = await readDb()
  return (db.documents || []).sort((a, b) => {
    // Pinned first, then by updated_at
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

export async function getDocumentsByFolder(folder: string): Promise<Document[]> {
  const docs = await getDocuments()
  return docs.filter(d => d.folder === folder)
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const db = await readDb()
  return (db.documents || []).find(d => d.id === id) || null
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const docs = await getDocuments()
  const q = query.toLowerCase()
  return docs.filter(d => 
    d.title.toLowerCase().includes(q) ||
    d.content.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q))
  )
}

export async function createDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
  const db = await readDb()
  if (!db.documents) db.documents = []
  
  const newDoc: Document = {
    ...doc,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  db.documents.push(newDoc)
  await writeDb(db)
  return newDoc
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
  const db = await readDb()
  if (!db.documents) db.documents = []
  
  const index = db.documents.findIndex(d => d.id === id)
  if (index === -1) return null
  
  db.documents[index] = {
    ...db.documents[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  await writeDb(db)
  return db.documents[index]
}

export async function deleteDocument(id: string): Promise<boolean> {
  const db = await readDb()
  if (!db.documents) return false
  
  const index = db.documents.findIndex(d => d.id === id)
  if (index === -1) return false
  
  db.documents.splice(index, 1)
  await writeDb(db)
  return true
}

export async function getFolders(): Promise<string[]> {
  const docs = await getDocuments()
  const folders = new Set(docs.map(d => d.folder))
  return Array.from(folders).sort()
}

// ============================================================================
// Projects
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  const db = await readDb()
  if (!db.projects) db.projects = []
  return db.projects.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  const db = await readDb()
  if (!db.projects) db.projects = []
  
  const newProject: Project = {
    id: generateProjectId(project.name),
    ...project,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  db.projects.push(newProject)
  await writeDb(db)
  return newProject
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = await readDb()
  if (!db.projects) return null
  return db.projects.find(p => p.id === id) || null
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const db = await readDb()
  if (!db.projects) return null
  
  const index = db.projects.findIndex(p => p.id === id)
  if (index === -1) return null
  
  db.projects[index] = {
    ...db.projects[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  await writeDb(db)
  return db.projects[index]
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await readDb()
  if (!db.projects) return false
  
  const index = db.projects.findIndex(p => p.id === id)
  if (index === -1) return false
  
  db.projects.splice(index, 1)
  await writeDb(db)
  return true
}

function generateProjectId(name: string): string {
  // Generate a URL-friendly ID from the project name
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
