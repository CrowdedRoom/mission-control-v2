import { NextResponse } from 'next/server'
import { getProjectById, updateProject, deleteProject } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectById(params.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validStatuses = ['backlog', 'active', 'completed']
    const updates: Record<string, unknown> = {}
    
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.status !== undefined && validStatuses.includes(body.status)) updates.status = body.status
    if (body.github_url !== undefined) updates.github_url = body.github_url?.trim() || null
    if (body.emoji !== undefined) updates.emoji = body.emoji
    if (body.color !== undefined) updates.color = body.color

    const project = await updateProject(params.id, updates)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteProject(params.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
