import { NextResponse } from 'next/server'
import { getTasks, createTask, logActivity } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await getTasks()
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
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
