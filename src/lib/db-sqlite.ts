import Database, { Database as DatabaseType } from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { Task, Activity, CalendarEvent, Document, Project } from './types'

// Lazy database initialization for Next.js compatibility
let _db: DatabaseType | null = null

function getDb(): DatabaseType {
  if (_db) return _db

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  // Initialize database
  const DB_PATH = join(dataDir, 'mission-control.db')
  _db = new Database(DB_PATH)

  // Enable WAL mode for better concurrent read performance
  _db.pragma('journal_mode = WAL')

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      assignee TEXT,
      project TEXT NOT NULL DEFAULT 'admin',
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      createdFrom TEXT
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start TEXT NOT NULL,
      end TEXT,
      all_day INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      category TEXT NOT NULL DEFAULT 'other',
      recurring TEXT NOT NULL DEFAULT 'none',
      reminder INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      folder TEXT NOT NULL DEFAULT 'general',
      author TEXT NOT NULL DEFAULT 'system',
      pinned INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      github_url TEXT,
      emoji TEXT NOT NULL DEFAULT '📋',
      color TEXT NOT NULL DEFAULT '#64748b',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  return _db
}

// ============================================================================
// Tasks
// ============================================================================

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: string
  assignee: string | null
  project: string
  priority: string
  created_at: string
  updated_at: string
  createdFrom: string | null
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Task['status'],
    assignee: row.assignee as Task['assignee'],
    project: row.project,
    priority: row.priority as Task['priority'],
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdFrom: row.createdFrom ?? undefined
  }
}

export async function getTasks(): Promise<Task[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM tasks ORDER BY created_at DESC
  `).all() as TaskRow[]
  return rows.map(rowToTask)
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as TaskRow | undefined
  return row ? rowToTask(row) : null
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO tasks (id, title, description, status, assignee, project, priority, created_at, updated_at, createdFrom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    task.title,
    task.description ?? null,
    task.status,
    task.assignee ?? null,
    task.project,
    task.priority,
    now,
    now,
    task.createdFrom ?? null
  )

  return {
    ...task,
    id,
    created_at: now,
    updated_at: now
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const db = getDb()
  const existing = await getTaskById(id)
  if (!existing) return null

  const updated: Task = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  }

  db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      status = ?,
      assignee = ?,
      project = ?,
      priority = ?,
      updated_at = ?,
      createdFrom = ?
    WHERE id = ?
  `).run(
    updated.title,
    updated.description ?? null,
    updated.status,
    updated.assignee ?? null,
    updated.project,
    updated.priority,
    updated.updated_at,
    updated.createdFrom ?? null,
    id
  )

  return updated
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = getDb()
  const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
  return result.changes > 0
}

// ============================================================================
// Activity
// ============================================================================

interface ActivityRow {
  id: string
  task_id: string | null
  action: string
  actor: string
  timestamp: string
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    task_id: row.task_id,
    action: row.action,
    actor: row.actor as Activity['actor'],
    timestamp: row.timestamp
  }
}

export async function getActivity(): Promise<Activity[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM activity ORDER BY timestamp DESC
  `).all() as ActivityRow[]
  return rows.map(rowToActivity)
}

export async function logActivity(action: string, actor: 'dj' | 'larry', taskId?: string): Promise<Activity> {
  const db = getDb()
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  db.prepare(`
    INSERT INTO activity (id, task_id, action, actor, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, taskId ?? null, action, actor, timestamp)

  // Keep only last 100 activities
  db.prepare(`
    DELETE FROM activity WHERE id NOT IN (
      SELECT id FROM activity ORDER BY timestamp DESC LIMIT 100
    )
  `).run()

  return {
    id,
    task_id: taskId ?? null,
    action,
    actor,
    timestamp
  }
}

// ============================================================================
// Calendar Events
// ============================================================================

interface EventRow {
  id: string
  title: string
  description: string | null
  start: string
  end: string | null
  all_day: number
  location: string | null
  color: string
  category: string
  recurring: string
  reminder: number | null
  created_at: string
  updated_at: string
}

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    start: row.start,
    end: row.end,
    all_day: row.all_day === 1,
    location: row.location,
    color: row.color,
    category: row.category as CalendarEvent['category'],
    recurring: row.recurring as CalendarEvent['recurring'],
    reminder: row.reminder,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM events ORDER BY start ASC
  `).all() as EventRow[]
  return rows.map(rowToEvent)
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
  const db = getDb()
  const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as EventRow | undefined
  return row ? rowToEvent(row) : null
}

export async function createEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO events (id, title, description, start, end, all_day, location, color, category, recurring, reminder, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    event.title,
    event.description ?? null,
    event.start,
    event.end ?? null,
    event.all_day ? 1 : 0,
    event.location ?? null,
    event.color,
    event.category,
    event.recurring,
    event.reminder ?? null,
    now,
    now
  )

  return {
    ...event,
    id,
    created_at: now,
    updated_at: now
  }
}

export async function updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  const db = getDb()
  const existing = await getEventById(id)
  if (!existing) return null

  const updated: CalendarEvent = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  }

  db.prepare(`
    UPDATE events SET
      title = ?,
      description = ?,
      start = ?,
      end = ?,
      all_day = ?,
      location = ?,
      color = ?,
      category = ?,
      recurring = ?,
      reminder = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updated.title,
    updated.description ?? null,
    updated.start,
    updated.end ?? null,
    updated.all_day ? 1 : 0,
    updated.location ?? null,
    updated.color,
    updated.category,
    updated.recurring,
    updated.reminder ?? null,
    updated.updated_at,
    id
  )

  return updated
}

export async function deleteEvent(id: string): Promise<boolean> {
  const db = getDb()
  const result = db.prepare(`DELETE FROM events WHERE id = ?`).run(id)
  return result.changes > 0
}

// ============================================================================
// Documents
// ============================================================================

interface DocumentRow {
  id: string
  title: string
  content: string
  folder: string
  author: string
  pinned: number
  tags: string
  created_at: string
  updated_at: string
}

function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    folder: row.folder,
    author: row.author as Document['author'],
    pinned: row.pinned === 1,
    tags: JSON.parse(row.tags),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export async function getDocuments(): Promise<Document[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM documents ORDER BY pinned DESC, updated_at DESC
  `).all() as DocumentRow[]
  return rows.map(rowToDocument)
}

export async function getDocumentsByFolder(folder: string): Promise<Document[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM documents WHERE folder = ? ORDER BY pinned DESC, updated_at DESC
  `).all(folder) as DocumentRow[]
  return rows.map(rowToDocument)
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id) as DocumentRow | undefined
  return row ? rowToDocument(row) : null
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const db = getDb()
  const q = `%${query.toLowerCase()}%`
  const rows = db.prepare(`
    SELECT * FROM documents
    WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(tags) LIKE ?
    ORDER BY pinned DESC, updated_at DESC
  `).all(q, q, q) as DocumentRow[]
  return rows.map(rowToDocument)
}

export async function createDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO documents (id, title, content, folder, author, pinned, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    doc.title,
    doc.content,
    doc.folder,
    doc.author,
    doc.pinned ? 1 : 0,
    JSON.stringify(doc.tags),
    now,
    now
  )

  return {
    ...doc,
    id,
    created_at: now,
    updated_at: now
  }
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
  const db = getDb()
  const existing = await getDocumentById(id)
  if (!existing) return null

  const updated: Document = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  }

  db.prepare(`
    UPDATE documents SET
      title = ?,
      content = ?,
      folder = ?,
      author = ?,
      pinned = ?,
      tags = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updated.title,
    updated.content,
    updated.folder,
    updated.author,
    updated.pinned ? 1 : 0,
    JSON.stringify(updated.tags),
    updated.updated_at,
    id
  )

  return updated
}

export async function deleteDocument(id: string): Promise<boolean> {
  const db = getDb()
  const result = db.prepare(`DELETE FROM documents WHERE id = ?`).run(id)
  return result.changes > 0
}

export async function getFolders(): Promise<string[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DISTINCT folder FROM documents ORDER BY folder ASC
  `).all() as { folder: string }[]
  return rows.map(r => r.folder)
}

// ============================================================================
// Projects
// ============================================================================

interface ProjectRow {
  id: string
  name: string
  description: string | null
  status: string
  github_url: string | null
  emoji: string
  color: string
  created_at: string
  updated_at: string
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as Project['status'],
    github_url: row.github_url,
    emoji: row.emoji,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export async function getProjects(): Promise<Project[]> {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM projects ORDER BY name ASC
  `).all() as ProjectRow[]
  return rows.map(rowToProject)
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
  const db = getDb()
  const id = generateProjectId(project.name)
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO projects (id, name, description, status, github_url, emoji, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    project.name,
    project.description ?? null,
    project.status,
    project.github_url ?? null,
    project.emoji,
    project.color,
    now,
    now
  )

  return {
    id,
    ...project,
    created_at: now,
    updated_at: now
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as ProjectRow | undefined
  return row ? rowToProject(row) : null
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const db = getDb()
  const existing = await getProjectById(id)
  if (!existing) return null

  const updated: Project = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  }

  db.prepare(`
    UPDATE projects SET
      name = ?,
      description = ?,
      status = ?,
      github_url = ?,
      emoji = ?,
      color = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.description ?? null,
    updated.status,
    updated.github_url ?? null,
    updated.emoji,
    updated.color,
    updated.updated_at,
    id
  )

  return updated
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = getDb()
  const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(id)
  return result.changes > 0
}

function generateProjectId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
