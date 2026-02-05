'use client'

import { useState, useEffect } from 'react'
import { FileText, Folder, Search, Plus, Clock, User, Pin, Trash2, X, Save, ArrowLeft, Edit2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type Document = {
  id: string
  title: string
  content: string
  folder: string
  author: 'dj' | 'larry'
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

const DEFAULT_FOLDERS = ['All', 'Getting Started', 'Planning', 'Family', 'Development', 'Notes', 'Projects']

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchDocuments()
    fetchFolders()
  }, [selectedFolder, searchQuery])

  const fetchDocuments = async () => {
    try {
      let url = '/api/documents'
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      else if (selectedFolder !== 'All') params.append('folder', selectedFolder)
      if (params.toString()) url += `?${params}`
      
      const res = await fetch(url)
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/documents?folders=true')
      const data = await res.json()
      const uniqueFolders = Array.from(new Set([...DEFAULT_FOLDERS.slice(1), ...data]))
      const allFolders = ['All', ...uniqueFolders]
      setFolders(allFolders)
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

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
      setSelectedDoc(updatedDoc)
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
      openDocument(newDoc)
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const openNewDocModal = () => {
    setEditForm({ title: '', content: '', folder: selectedFolder === 'All' ? '' : selectedFolder, pinned: false, tags: '' })
    setShowNewDocModal(true)
  }

  // Document viewer/editor
  if (selectedDoc) {
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
            {isEditing ? (
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
                <div className="prose prose-invert max-w-none">
                  {selectedDoc.content ? (
                    <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                      {selectedDoc.content}
                    </pre>
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
        <button 
          onClick={openNewDocModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          New Document
        </button>
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
          <div className="col-span-3">Folder</div>
          <div className="col-span-2">Last Edited</div>
          <div className="col-span-2">Author</div>
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
                  <FileText size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-200 font-medium block truncate">{doc.title}</span>
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
                  <FileText size={18} className="text-blue-400 flex-shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{doc.title}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2 text-slate-400">
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
