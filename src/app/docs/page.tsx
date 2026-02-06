'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Folder, Search, Plus, Clock, User, Pin, Trash2, X, Save, ArrowLeft, Edit2, RefreshCw, Database, HardDrive } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type Document = {
  id: string
  title: string
  content: string
  folder: string
  author: 'dj' | 'larry' | 'system'
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
  source?: 'db' | 'file'
}

const DEFAULT_FOLDERS = ['All', 'Getting Started', 'Planning', 'Family', 'Development', 'Notes', 'Projects']

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    folder: '',
    pinned: false,
    tags: ''
  })

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      else if (selectedFolder !== 'All') params.append('folder', selectedFolder)
      const qs = params.toString() ? `?${params}` : ''

      // Fetch DB docs and file docs in parallel
      const [dbRes, fileRes] = await Promise.all([
        fetch(`/api/documents${qs}`),
        fetch(`/api/markdown-files${qs}`)
      ])

      const dbDocs: Document[] = await dbRes.json()
      const fileDocs: Document[] = await fileRes.json().catch(() => [])

      // Tag each source
      const taggedDb = dbDocs.map(d => ({ ...d, source: 'db' as const }))
      const taggedFiles = fileDocs.map(d => ({ ...d, source: 'file' as const }))

      // Merge: pinned DB docs first, then all by updated_at
      const merged = [...taggedDb, ...taggedFiles].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })

      setDocuments(merged)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [searchQuery, selectedFolder])

  const fetchFolders = useCallback(async () => {
    try {
      const [dbRes, fileRes] = await Promise.all([
        fetch('/api/documents?folders=true'),
        fetch('/api/markdown-files?folders=true')
      ])

      const dbFolders: string[] = await dbRes.json()
      const fileFolders: string[] = await fileRes.json().catch(() => [])

      const uniqueFolders = Array.from(new Set([...DEFAULT_FOLDERS.slice(1), ...dbFolders, ...fileFolders]))
      setFolders(['All', ...uniqueFolders.sort()])
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
    fetchFolders()
  }, [fetchDocuments, fetchFolders])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDocuments()
    fetchFolders()
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/documents/sync', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        alert(data.message)
        fetchDocuments()
        fetchFolders()
      } else {
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Sync failed. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  const isFileDoc = (doc: Document) => doc.source === 'file'

  const openDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setEditForm({
      title: doc.title,
      content: doc.content,
      folder: doc.folder,
      pinned: doc.pinned,
      tags: doc.tags.join(', ')
    })
    setIsEditing(false)
  }

  const startEditing = () => {
    setIsEditing(true)
  }

  const saveDocument = async () => {
    if (!selectedDoc) return

    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          folder: editForm.folder,
          pinned: editForm.pinned,
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })
      const updatedDoc = await res.json()
      setSelectedDoc({ ...updatedDoc, source: 'db' })
      setIsEditing(false)
      fetchDocuments()
      fetchFolders()
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }

  const deleteDocument = async () => {
    if (!selectedDoc || !confirm('Delete this document?')) return

    try {
      await fetch(`/api/documents/${selectedDoc.id}`, { method: 'DELETE' })
      setSelectedDoc(null)
      fetchDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          folder: editForm.folder || 'Uncategorized',
          author: 'larry',
          pinned: false,
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })
      const newDoc = await res.json()
      setShowNewDocModal(false)
      setEditForm({ title: '', content: '', folder: '', pinned: false, tags: '' })
      fetchDocuments()
      fetchFolders()
      openDocument({ ...newDoc, source: 'db' })
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const openNewDocModal = () => {
    setEditForm({ title: '', content: '', folder: selectedFolder === 'All' ? '' : selectedFolder, pinned: false, tags: '' })
    setShowNewDocModal(true)
  }

  const SourceBadge = ({ source }: { source?: 'db' | 'file' }) => {
    if (source === 'file') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400 rounded">
          <HardDrive size={10} />
          File
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/15 text-blue-400 rounded">
        <Database size={10} />
        DB
      </span>
    )
  }

  // Document viewer/editor
  if (selectedDoc) {
    const readOnly = isFileDoc(selectedDoc)

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedDoc(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Documents
          </button>
          <div className="flex items-center gap-2">
            {readOnly ? (
              <span className="px-3 py-1.5 text-xs text-slate-400 bg-slate-700/50 rounded-lg">
                Read-only (filesystem)
              </span>
            ) : isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDocument}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  <Save size={18} />
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={deleteDocument}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {isEditing ? (
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full text-2xl font-bold bg-transparent border-b border-slate-700 pb-2 text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="Document title"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Folder</label>
                  <input
                    type="text"
                    value={editForm.folder}
                    onChange={(e) => setEditForm({ ...editForm, folder: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Folder name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={editForm.pinned}
                  onChange={(e) => setEditForm({ ...editForm, pinned: e.target.checked })}
                  className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pinned" className="text-sm text-slate-300">Pin to top</label>
              </div>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                className="w-full h-96 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write your document in Markdown..."
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    {selectedDoc.pinned && <Pin size={18} className="text-yellow-500" />}
                    {selectedDoc.title}
                    <SourceBadge source={selectedDoc.source} />
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Folder size={14} />
                      {selectedDoc.folder}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {selectedDoc.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(parseISO(selectedDoc.updated_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {selectedDoc.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {selectedDoc.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-700 pt-6">
                <div className="prose prose-invert prose-slate max-w-none">
                  {selectedDoc.content ? (
                    <div className="text-slate-300 leading-relaxed markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-slate-100">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-slate-100">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2 text-slate-200">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-2 text-slate-200">{children}</h4>,
                        p: ({ children }) => <p className="mb-4 text-slate-300">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-slate-300">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-300">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        code: ({ className, children }) => {
                          const isInline = !className
                          return isInline ? (
                            <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-slate-200">{children}</code>
                          ) : (
                            <code className={`${className} text-sm`}>{children}</code>
                          )
                        },
                        pre: ({ children }) => (
                          <pre className="bg-slate-900 p-4 rounded-lg my-4 overflow-x-auto border border-slate-700">{children}</pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-slate-600 pl-4 my-4 italic text-slate-400">{children}</blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-slate-700 rounded-lg">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => <th className="bg-slate-700 px-4 py-2 text-left font-semibold text-slate-200 border-b border-slate-600">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2 border-b border-slate-700 text-slate-300">{children}</td>,
                        hr: () => <hr className="my-6 border-slate-700" />,
                        strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {selectedDoc.content}
                    </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No content yet. Click Edit to add content.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Document list view
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1 md:mb-2">Documents</h1>
          <p className="text-sm md:text-base text-slate-400">Shared knowledge and documentation.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            title="Sync files from workspace and Second Brain"
          >
            <HardDrive size={18} className={syncing ? 'animate-pulse' : ''} />
            <span className="hidden md:inline">Sync</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            title="Refresh documents"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span className="sm:hidden">Refresh</span>
          </button>
          <button
            onClick={openNewDocModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex-1 sm:flex-none"
          >
            <Plus size={18} />
            New Document
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Folder Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {folders.map(folder => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedFolder === folder
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Folder</div>
          <div className="col-span-2">Last Edited</div>
          <div className="col-span-2">Author</div>
          <div className="col-span-1">Source</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No documents found</p>
            <button
              onClick={openNewDocModal}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              Create your first document
            </button>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => openDocument(doc)}
              className="p-4 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start gap-3">
                  {doc.pinned && <Pin size={14} className="text-yellow-500 flex-shrink-0 mt-1" />}
                  <FileText size={18} className={`flex-shrink-0 mt-0.5 ${doc.source === 'file' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium truncate">{doc.title}</span>
                      <SourceBadge source={doc.source} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Folder size={12} />
                        {doc.folder}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {format(parseISO(doc.updated_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Desktop Layout */}
              <div className="hidden md:grid grid-cols-12 gap-4">
                <div className="col-span-5 flex items-center gap-3">
                  {doc.pinned && <Pin size={14} className="text-yellow-500 flex-shrink-0" />}
                  <FileText size={18} className={`flex-shrink-0 ${doc.source === 'file' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span className="text-slate-200 font-medium truncate">{doc.title}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-400">
                  <Folder size={14} />
                  {doc.folder}
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-400 text-sm">
                  <Clock size={14} />
                  {format(parseISO(doc.updated_at), 'MMM d')}
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-400 text-sm">
                  <User size={14} />
                  {doc.author}
                </div>
                <div className="col-span-1 flex items-center">
                  <SourceBadge source={doc.source} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">New Document</h3>
              <button
                onClick={() => setShowNewDocModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createDocument} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Folder</label>
                <input
                  type="text"
                  value={editForm.folder}
                  onChange={(e) => setEditForm({ ...editForm, folder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Folder name"
                  list="folder-suggestions"
                />
                <datalist id="folder-suggestions">
                  {folders.filter(f => f !== 'All').map(f => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="project, planning, ideas"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
