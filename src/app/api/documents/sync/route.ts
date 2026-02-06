import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { createDocument, getDocuments } from '@/lib/db'

const WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw/workspace')
const SECOND_BRAIN_PATH = path.join(process.env.HOME || '', 'Documents/SecondBrain')

interface SyncResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

async function scanDirectory(dir: string, baseFolder: string): Promise<Array<{ path: string, folder: string }>> {
  const files: Array<{ path: string, folder: string }> = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip hidden dirs and git
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        
        const subFolder = path.join(baseFolder, entry.name)
        const subFiles = await scanDirectory(fullPath, subFolder)
        files.push(...subFiles)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push({ path: fullPath, folder: baseFolder })
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error)
  }
  
  return files
}

export async function POST() {
  const result: SyncResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: []
  }
  
  try {
    // Get existing documents to check for duplicates
    const existingDocs = await getDocuments()
    const existingTitles = new Set(existingDocs.map(d => d.title))
    
    // Scan workspace files
    const workspaceFiles = await scanDirectory(WORKSPACE_PATH, 'Workspace')
    
    // Scan Second Brain files
    const secondBrainFiles = await scanDirectory(SECOND_BRAIN_PATH, 'SecondBrain')
    
    const allFiles = [...workspaceFiles, ...secondBrainFiles]
    
    for (const { path: filePath, folder } of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const filename = path.basename(filePath, '.md')
        const title = filename.replace(/-/g, ' ')
        
        // Skip if already imported
        if (existingTitles.has(title)) {
          result.skipped++
          continue
        }
        
        // Import the document
        await createDocument({
          title,
          content,
          folder,
          author: 'system',
          pinned: false,
          tags: []
        })
        
        result.imported++
      } catch (error) {
        const errorMsg = `Failed to import ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
    
    return NextResponse.json({
      success: true,
      result,
      message: `Synced ${result.imported} new documents (${result.skipped} already imported)`
    })
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
