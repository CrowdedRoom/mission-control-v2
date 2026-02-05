import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join, basename, extname } from 'path'
import { homedir } from 'os'

type FileDocument = {
  id: string
  title: string
  content: string
  folder: string
  author: 'dj' | 'larry'
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
  source: 'file'
  filePath: string
}

// Directories to scan for markdown files
// recursive: true = scan subdirectories, false = root-level .md only
const SCAN_DIRECTORIES: { path: string; recursive: boolean }[] = [
  { path: join(homedir(), 'Documents', 'SecondBrain'), recursive: true },
  { path: join(homedir(), '.openclaw', 'workspace'), recursive: false },
  { path: join(homedir(), '.openclaw', 'workspace', 'memory'), recursive: true },
]

/**
 * Extract title from markdown content (first # heading) or use filename
 */
function extractTitle(content: string, filename: string): string {
  // Look for first # heading
  const match = content.match(/^#\s+(.+)$/m)
  if (match && match[1]) {
    return match[1].trim()
  }
  // Fall back to filename without extension
  return basename(filename, extname(filename))
}

/**
 * Derive folder name from file path relative to scan directory
 */
function deriveFolder(filePath: string, scanDir: string): string {
  const relative = filePath.replace(scanDir, '').replace(/^\//, '')
  const parts = relative.split('/')

  // If file is in a subdirectory, use the first directory as folder
  if (parts.length > 1) {
    return parts[0]
  }

  // Otherwise, use the scan directory name as folder
  return basename(scanDir)
}

/**
 * Recursively scan a directory for markdown files
 */
async function scanDirectory(dir: string, scanRoot: string, recursive = true): Promise<FileDocument[]> {
  const documents: FileDocument[] = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory() && recursive) {
        // Recursively scan subdirectories
        const subDocs = await scanDirectory(fullPath, scanRoot, true)
        documents.push(...subDocs)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const stats = await fs.stat(fullPath)

          // Create unique ID from file path
          const id = `file:${Buffer.from(fullPath).toString('base64url')}`

          documents.push({
            id,
            title: extractTitle(content, entry.name),
            content,
            folder: deriveFolder(fullPath, scanRoot),
            author: 'larry', // Default author for file docs
            pinned: false,
            tags: [],
            created_at: stats.birthtime.toISOString(),
            updated_at: stats.mtime.toISOString(),
            source: 'file',
            filePath: fullPath,
          })
        } catch (readErr) {
          console.error(`Failed to read file ${fullPath}:`, readErr)
        }
      }
    }
  } catch (err) {
    // Directory doesn't exist or isn't accessible - skip silently
    console.log(`Skipping directory ${dir}:`, (err as Error).message)
  }

  return documents
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase()
    const folder = searchParams.get('folder')
    const foldersOnly = searchParams.get('folders')

    // Scan all configured directories
    let allDocs: FileDocument[] = []

    for (const { path: dir, recursive } of SCAN_DIRECTORIES) {
      const docs = await scanDirectory(dir, dir, recursive)
      allDocs.push(...docs)
    }

    // Deduplicate by file path (in case memory is inside workspace)
    const seen = new Set<string>()
    allDocs = allDocs.filter(doc => {
      if (seen.has(doc.filePath)) return false
      seen.add(doc.filePath)
      return true
    })

    // Return only folders if requested
    if (foldersOnly === 'true') {
      const folders = Array.from(new Set(allDocs.map(d => d.folder))).sort()
      return NextResponse.json(folders)
    }

    // Filter by search query
    if (query) {
      allDocs = allDocs.filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.content.toLowerCase().includes(query) ||
        d.folder.toLowerCase().includes(query)
      )
    }

    // Filter by folder
    if (folder && folder !== 'All') {
      allDocs = allDocs.filter(d => d.folder === folder)
    }

    // Sort by updated_at (most recent first)
    allDocs.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    return NextResponse.json(allDocs)
  } catch (error) {
    console.error('Failed to scan markdown files:', error)
    return NextResponse.json({ error: 'Failed to scan markdown files' }, { status: 500 })
  }
}
