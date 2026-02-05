import { NextResponse } from 'next/server'
import { getEvents, createEvent, getEventsByDateRange } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    let events
    if (start && end) {
      events = await getEventsByDateRange(new Date(start), new Date(end))
    } else {
      events = await getEvents()
    }
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
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
    if (!body.title || !body.start) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }
    
    const event = await createEvent({
      title: body.title,
      description: body.description || null,
      start: body.start,
      end: body.end || null,
      all_day: body.all_day || false,
      location: body.location || null,
      color: body.color || '#3b82f6',
      category: body.category || 'other',
      recurring: body.recurring || 'none',
      reminder: body.reminder || null
    })
    
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
