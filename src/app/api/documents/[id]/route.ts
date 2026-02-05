import { NextResponse } from 'next/server'
import { getDocumentById, updateDocument, deleteDocument } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const doc = await updateDocument(params.id, body)
    
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteDocument(params.id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
