import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask, logActivity } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''

    const tasks = await getTasks()

    const filtered = query
      ? tasks.filter((task: { title: string; description?: string | null }) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        )
      : tasks

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    // Validate required fields
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    const task = await createTask({
      title: body.title,
      description: body.description || null,
      status: body.status || 'backlog',
      assignee: body.assignee || null,
      project: body.project || 'mission-control',
      priority: body.priority || 'medium'
    })

    // Log activity
    await logActivity(
      `created task "${task.title}"`,
      body.created_by || 'dj',
      task.id
    )

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
