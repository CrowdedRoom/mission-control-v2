import { NextResponse } from 'next/server'
import { updateTask, deleteTask, getTaskById, logActivity } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    // Get task for activity logging
    const existingTask = await getTaskById(id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await updateTask(id, body)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Log activity for status changes
    if (body.status && body.status !== existingTask.status) {
      const statusLabels: Record<string, string> = {
        backlog: 'moved to Backlog',
        in_progress: 'started work on',
        review: 'submitted for review',
        done: 'completed'
      }
      
      const actionText = statusLabels[body.status] || `changed status to ${body.status}`
      
      await logActivity(
        `${actionText} "${task.title}"`,
        body.updated_by || 'dj',
        id
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const success = await deleteTask(id)
    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
