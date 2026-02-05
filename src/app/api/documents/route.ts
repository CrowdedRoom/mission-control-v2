import { NextResponse } from 'next/server'
import { getDocuments, createDocument, searchDocuments, getDocumentsByFolder, getFolders } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const folder = searchParams.get('folder')
    const foldersOnly = searchParams.get('folders')
    
    if (foldersOnly === 'true') {
      const folders = await getFolders()
      return NextResponse.json(folders)
    }
    
    let documents
    if (query) {
      documents = await searchDocuments(query)
    } else if (folder && folder !== 'All') {
      documents = await getDocumentsByFolder(folder)
    } else {
      documents = await getDocuments()
    }
    
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
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
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    const doc = await createDocument({
      title: body.title,
      content: body.content || '',
      folder: body.folder || 'Uncategorized',
      author: body.author || 'larry',
      pinned: body.pinned || false,
      tags: body.tags || []
    })
    
    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
