import { NextResponse } from 'next/server'
import { getPipelineAppById, updatePipelineApp } from '@/lib/db-sqlite'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const app = getPipelineAppById(id)
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    return NextResponse.json(app)
  } catch (error) {
    console.error('Error fetching pipeline app:', error)
    return NextResponse.json({ error: 'Failed to fetch pipeline app' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}

    // Allow updating specific fields
    if (body.phase !== undefined) updates.phase = body.phase
    if (body.blocker !== undefined) updates.blocker = body.blocker || null
    if (body.next_action !== undefined) updates.next_action = body.next_action || null
    if (body.assignee !== undefined) updates.assignee = body.assignee || null
    if (body.notes !== undefined) updates.notes = body.notes || null
    if (body.revenue_monthly !== undefined) updates.revenue_monthly = body.revenue_monthly
    if (body.store_url !== undefined) updates.store_url = body.store_url || null
    if (body.github_url !== undefined) updates.github_url = body.github_url || null
    if (body.name !== undefined) updates.name = body.name
    if (body.emoji !== undefined) updates.emoji = body.emoji
    if (body.color !== undefined) updates.color = body.color
    if (body.stack !== undefined) updates.stack = body.stack || null
    if (body.phases !== undefined) updates.phases = body.phases

    const app = updatePipelineApp(id, updates)
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }
    return NextResponse.json(app)
  } catch (error) {
    console.error('Error updating pipeline app:', error)
    return NextResponse.json({ error: 'Failed to update pipeline app' }, { status: 500 })
  }
}
