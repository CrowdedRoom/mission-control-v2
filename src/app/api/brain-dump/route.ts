import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

type ProcessedItem = {
  type: 'task' | 'event' | 'note'
  title: string
  details?: string
  status: 'success' | 'error'
}

/**
 * Simple date parser - looks for common date patterns
 */
function extractDate(text: string): Date | null {
  const lowerText = text.toLowerCase()
  const now = new Date()
  
  // Tomorrow
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }
  
  // Next week
  if (lowerText.includes('next week')) {
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek
  }
  
  // Try to match common date formats
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,    // MM-DD-YYYY
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})/i  // Month DD
  ]
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      // For now, just return a date in the future
      // A proper implementation would parse these correctly
      const future = new Date(now)
      future.setDate(future.getDate() + 7)
      return future
    }
  }
  
  return null
}

/**
 * Extract time from text
 */
function extractTime(text: string): string | null {
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)/i
  const match = text.match(timePattern)
  if (match) {
    return match[0]
  }
  return null
}

/**
 * Determine if line is a task
 */
function isTask(line: string): boolean {
  const taskIndicators = [
    /^task:/i,
    /^todo:/i,
    /^\[ \]/,
    /^- \[ \]/,
    /^need to /i,
    /^remember to /i,
    /^don't forget/i
  ]
  
  return taskIndicators.some(pattern => pattern.test(line.trim()))
}

/**
 * Determine if line is an event
 */
function isEvent(line: string): boolean {
  const hasDate = extractDate(line) !== null
  const hasTime = extractTime(line) !== null
  const hasEventWords = /\b(meeting|call|appointment|dinner|lunch|event)\b/i.test(line)
  
  return hasDate || hasTime || hasEventWords
}

export async function POST(request: Request) {
  try {
    const { input, user = 'dj' } = await request.json()
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    
    const lines = input.split('\n').filter(l => l.trim().length > 0)
    const processed: ProcessedItem[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip empty lines
      if (!trimmed) continue
      
      // Determine type and process
      if (isTask(trimmed)) {
        // Create task
        const title = trimmed
          .replace(/^(task:|todo:|\[ \]|- \[ \]|need to |remember to |don't forget )/i, '')
          .trim()
        
        try {
          const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              status: 'backlog',
              priority: 'medium',
              project: 'personal',
              created_by: user
            })
          })
          
          if (res.ok) {
            processed.push({
              type: 'task',
              title,
              status: 'success'
            })
          } else {
            processed.push({
              type: 'task',
              title,
              status: 'error',
              details: 'Failed to create task'
            })
          }
        } catch (error) {
          processed.push({
            type: 'task',
            title,
            status: 'error',
            details: String(error)
          })
        }
      } else if (isEvent(trimmed)) {
        // Create calendar event
        const date = extractDate(trimmed)
        const time = extractTime(trimmed)
        
        try {
          const eventDate = date || new Date()
          const res = await fetch(`http://localhost:${process.env.PORT || 3001}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: trimmed,
              start: eventDate.toISOString(),
              end: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
              category: 'personal',
              created_by: user
            })
          })
          
          if (res.ok) {
            processed.push({
              type: 'event',
              title: trimmed,
              details: time ? `at ${time}` : undefined,
              status: 'success'
            })
          } else {
            processed.push({
              type: 'event',
              title: trimmed,
              status: 'error',
              details: 'Failed to create event'
            })
          }
        } catch (error) {
          processed.push({
            type: 'event',
            title: trimmed,
            status: 'error',
            details: String(error)
          })
        }
      } else {
        // Save as note to Second Brain
        try {
          const notesDir = join(homedir(), 'Documents', 'SecondBrain', 'Brain Dumps')
          await fs.mkdir(notesDir, { recursive: true })
          
          const timestamp = new Date().toISOString().split('T')[0]
          const fileName = `${timestamp}-brain-dump.md`
          const filePath = join(notesDir, fileName)
          
          // Append to today's brain dump file
          const content = `\n## ${new Date().toLocaleTimeString()}\n${trimmed}\n`
          
          try {
            const existing = await fs.readFile(filePath, 'utf-8')
            await fs.writeFile(filePath, existing + content)
          } catch {
            // File doesn't exist, create it
            await fs.writeFile(filePath, `# Brain Dump - ${timestamp}\n${content}`)
          }
          
          processed.push({
            type: 'note',
            title: trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed,
            details: 'Saved to Second Brain',
            status: 'success'
          })
        } catch {
          processed.push({
            type: 'note',
            title: trimmed,
            status: 'error',
            details: 'Failed to save note'
          })
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      processed,
      summary: {
        total: processed.length,
        tasks: processed.filter(p => p.type === 'task').length,
        events: processed.filter(p => p.type === 'event').length,
        notes: processed.filter(p => p.type === 'note').length
      }
    })
  } catch (error) {
    console.error('Brain dump processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process brain dump',
      details: String(error)
    }, { status: 500 })
  }
}
