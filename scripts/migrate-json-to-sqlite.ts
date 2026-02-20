import Database from 'better-sqlite3'
import { existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const JSON_DB_PATH = join(process.cwd(), 'data', 'db.json')
const SQLITE_DB_PATH = join(process.cwd(), 'data', 'mission-control.db')

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  assignee: string | null
  project: string
  priority: string
  created_at: string
  updated_at: string
  createdFrom?: string
}

interface Activity {
  id: string
  task_id: string | null
  action: string
  actor: string
  timestamp: string
}

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start: string
  end: string | null
  all_day: boolean
  location: string | null
  color: string
  category: string
  recurring: string
  reminder: number | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  title: string
  content: string
  folder: string
  author: string
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

interface Project {
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

interface JsonDatabase {
  tasks?: Task[]
  activity?: Activity[]
  events?: CalendarEvent[]
  documents?: Document[]
  projects?: Project[]
}

function migrate() {
  console.log('=== JSON to SQLite Migration ===\n')

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
    console.log('Created data directory')
  }

  // Check if JSON database exists
  if (!existsSync(JSON_DB_PATH)) {
    console.log('No JSON database found at', JSON_DB_PATH)
    console.log('Nothing to migrate. SQLite database will be initialized on first use.')
    return
  }

  // Read JSON database
  const jsonData: JsonDatabase = JSON.parse(readFileSync(JSON_DB_PATH, 'utf-8'))
  console.log('Read JSON database from', JSON_DB_PATH)

  // Initialize SQLite database
  const db = new Database(SQLITE_DB_PATH)
  db.pragma('journal_mode = WAL')
  console.log('Initialized SQLite database at', SQLITE_DB_PATH)

  // Create tables
  db.exec(`
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

  let summary = {
    tasks: 0,
    activity: 0,
    events: 0,
    documents: 0,
    projects: 0
  }

  // Migrate tasks
  if (jsonData.tasks && jsonData.tasks.length > 0) {
    const insertTask = db.prepare(`
      INSERT OR IGNORE INTO tasks (id, title, description, status, assignee, project, priority, created_at, updated_at, createdFrom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const task of jsonData.tasks) {
      const result = insertTask.run(
        task.id,
        task.title,
        task.description ?? null,
        task.status,
        task.assignee ?? null,
        task.project,
        task.priority,
        task.created_at,
        task.updated_at,
        task.createdFrom ?? null
      )
      if (result.changes > 0) summary.tasks++
    }
  }
  console.log(`Migrated ${summary.tasks} tasks`)

  // Migrate activity
  if (jsonData.activity && jsonData.activity.length > 0) {
    const insertActivity = db.prepare(`
      INSERT OR IGNORE INTO activity (id, task_id, action, actor, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const act of jsonData.activity) {
      const result = insertActivity.run(
        act.id,
        act.task_id ?? null,
        act.action,
        act.actor,
        act.timestamp
      )
      if (result.changes > 0) summary.activity++
    }
  }
  console.log(`Migrated ${summary.activity} activity records`)

  // Migrate events
  if (jsonData.events && jsonData.events.length > 0) {
    const insertEvent = db.prepare(`
      INSERT OR IGNORE INTO events (id, title, description, start, end, all_day, location, color, category, recurring, reminder, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const event of jsonData.events) {
      const result = insertEvent.run(
        event.id,
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
        event.created_at,
        event.updated_at
      )
      if (result.changes > 0) summary.events++
    }
  }
  console.log(`Migrated ${summary.events} events`)

  // Migrate documents
  if (jsonData.documents && jsonData.documents.length > 0) {
    const insertDocument = db.prepare(`
      INSERT OR IGNORE INTO documents (id, title, content, folder, author, pinned, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const doc of jsonData.documents) {
      const result = insertDocument.run(
        doc.id,
        doc.title,
        doc.content,
        doc.folder,
        doc.author,
        doc.pinned ? 1 : 0,
        JSON.stringify(doc.tags),
        doc.created_at,
        doc.updated_at
      )
      if (result.changes > 0) summary.documents++
    }
  }
  console.log(`Migrated ${summary.documents} documents`)

  // Migrate projects
  if (jsonData.projects && jsonData.projects.length > 0) {
    const insertProject = db.prepare(`
      INSERT OR IGNORE INTO projects (id, name, description, status, github_url, emoji, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const project of jsonData.projects) {
      const result = insertProject.run(
        project.id,
        project.name,
        project.description ?? null,
        project.status,
        project.github_url ?? null,
        project.emoji,
        project.color,
        project.created_at,
        project.updated_at
      )
      if (result.changes > 0) summary.projects++
    }
  }
  console.log(`Migrated ${summary.projects} projects`)

  db.close()

  console.log('\n=== Migration Summary ===')
  console.log(`Tasks:     ${summary.tasks}`)
  console.log(`Activity:  ${summary.activity}`)
  console.log(`Events:    ${summary.events}`)
  console.log(`Documents: ${summary.documents}`)
  console.log(`Projects:  ${summary.projects}`)
  console.log('\nMigration complete!')
}

migrate()
