import { NextResponse } from 'next/server'
import { getProjects, createProject } from '@/lib/db'

export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
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
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }
    
    const project = await createProject({
      name: body.name,
      emoji: body.emoji || '📦',
      color: body.color || '#64748b'
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
