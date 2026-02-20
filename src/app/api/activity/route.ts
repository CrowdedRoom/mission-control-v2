import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import { join } from 'path'

// Get database connection
function getDb() {
  const DB_PATH = join(process.cwd(), 'data', 'mission-control.db')
  return new Database(DB_PATH)
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)

    // Query params
    const actor = searchParams.get('actor')
    const project = searchParams.get('project')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const before = searchParams.get('before')

    // Build query dynamically
    let query = `
      SELECT a.*, t.title as task_title, t.project as task_project
      FROM activity a
      LEFT JOIN tasks t ON a.task_id = t.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (actor) {
      query += ` AND a.actor = ?`
      params.push(actor)
    }

    if (project) {
      query += ` AND t.project = ?`
      params.push(project)
    }

    if (before) {
      query += ` AND a.timestamp < ?`
      params.push(before)
    }

    query += ` ORDER BY a.timestamp DESC LIMIT ?`
    params.push(limit)

    const rows = db.prepare(query).all(...params)
    db.close()

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()

    const { action, actor, task_id } = body

    if (!action || !actor) {
      return NextResponse.json({ error: 'action and actor are required' }, { status: 400 })
    }

    if (!['dj', 'larry', 'system'].includes(actor)) {
      return NextResponse.json({ error: 'actor must be dj, larry, or system' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    db.prepare(`
      INSERT INTO activity (id, task_id, action, actor, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, task_id ?? null, action, actor, timestamp)

    // Keep only last 500 activities (increased limit for full feed)
    db.prepare(`
      DELETE FROM activity WHERE id NOT IN (
        SELECT id FROM activity ORDER BY timestamp DESC LIMIT 500
      )
    `).run()

    const activity = {
      id,
      task_id: task_id ?? null,
      action,
      actor,
      timestamp
    }

    db.close()

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
