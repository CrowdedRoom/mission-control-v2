import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export type MemoryFile = {
  id: string
  filename: string
  title: string
  preview: string
  content: string
  updatedAt: string
  pinned: boolean
}

function extractTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) return match[1].trim()
  return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ')
}

function extractPreview(content: string): string {
  // Strip markdown headings, bold, links, etc. for preview
  return content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 200)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toLowerCase() || ''

  const memoryPath = process.env.OPENCLAW_MEMORY_PATH
  const workspacePath = process.env.OPENCLAW_WORKSPACE_PATH

  if (!memoryPath || !workspacePath) {
    return NextResponse.json({ memories: [] })
  }

  const memories: MemoryFile[] = []

  // Read MEMORY.md from workspace root — pinned index file
  try {
    const mainPath = join(workspacePath, 'MEMORY.md')
    const content = await fs.readFile(mainPath, 'utf-8')
    const stat = await fs.stat(mainPath)
    memories.push({
      id: 'MEMORY.md',
      filename: 'MEMORY.md',
      title: '📌 MEMORY.md — Orientation Index',
      preview: extractPreview(content),
      content,
      updatedAt: stat.mtime.toISOString(),
      pinned: true,
    })
  } catch {
    // skip if missing
  }

  // Read all *.md files from memory/ directory
  try {
    const files = await fs.readdir(memoryPath)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    for (const file of mdFiles) {
      try {
        const filePath = join(memoryPath, file)
        const stat = await fs.stat(filePath)
        
        // Skip subdirectories
        if (stat.isDirectory()) continue

        const content = await fs.readFile(filePath, 'utf-8')
        memories.push({
          id: file,
          filename: file,
          title: extractTitle(content, file),
          preview: extractPreview(content),
          content,
          updatedAt: stat.mtime.toISOString(),
          pinned: false,
        })
      } catch {
        // skip unreadable files
      }
    }

    // Also check memory/briefs/ subdirectory
    try {
      const briefsPath = join(memoryPath, 'briefs')
      const briefFiles = await fs.readdir(briefsPath)
      for (const file of briefFiles.filter(f => f.endsWith('.md'))) {
        try {
          const filePath = join(briefsPath, file)
          const stat = await fs.stat(filePath)
          const content = await fs.readFile(filePath, 'utf-8')
          memories.push({
            id: `briefs/${file}`,
            filename: `briefs/${file}`,
            title: extractTitle(content, `Brief: ${file.replace('.md', '')}`),
            preview: extractPreview(content),
            content,
            updatedAt: stat.mtime.toISOString(),
            pinned: false,
          })
        } catch { /* skip */ }
      }
    } catch { /* briefs dir may not exist */ }

  } catch (err) {
    console.error('[/api/memories] Failed to read memory dir:', err)
  }

  // Filter by query
  const filtered = query
    ? memories.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query)
      )
    : memories

  // Sort: pinned first, then by updatedAt desc
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return NextResponse.json({ memories: filtered })
}
