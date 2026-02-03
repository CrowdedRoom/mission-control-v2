import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { id } = params

  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity for status changes
  if (body.status) {
    const statusLabels: Record<string, string> = {
      backlog: 'moved to Backlog',
      in_progress: 'started work on',
      review: 'submitted for review',
      done: 'completed'
    }
    
    await supabase.from('activity').insert({
      task_id: id,
      action: `${statusLabels[body.status]} "${data.title}"`,
      actor: body.updated_by || 'dj'
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
