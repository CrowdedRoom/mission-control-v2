'use client'

import { useState } from 'react'
import { FileText, Folder, Search, Plus, Clock, User } from 'lucide-react'

const DOCS = [
  {
    id: '1',
    title: 'Mission Control - Getting Started',
    folder: 'Getting Started',
    lastEdited: '2026-02-03',
    author: 'Larry'
  },
  {
    id: '2',
    title: 'Project Ideas & Backlog',
    folder: 'Planning',
    lastEdited: '2026-02-03',
    author: 'DJ'
  },
  {
    id: '3',
    title: 'Family Calendar 2026',
    folder: 'Family',
    lastEdited: '2026-02-02',
    author: 'DJ'
  }
]

const FOLDERS = ['All', 'Getting Started', 'Planning', 'Family', 'Development', 'Notes']

export default function DocsPage() {
  const [selectedFolder, setSelectedFolder] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDocs = DOCS.filter(doc => {
    const matchesFolder = selectedFolder === 'All' || doc.folder === selectedFolder
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFolder && matchesSearch
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Documents</h1>
          <p className="text-slate-400">Shared knowledge and documentation.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
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
        {FOLDERS.map(folder => (
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
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-6">Name</div>
          <div className="col-span-3">Folder</div>
          <div className="col-span-2">Last Edited</div>
          <div className="col-span-1">Author</div>
        </div>

        {filteredDocs.map(doc => (
          <div 
            key={doc.id}
            className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <div className="col-span-6 flex items-center gap-3">
              <FileText size={18} className="text-blue-400" />
              <span className="text-slate-200 font-medium">{doc.title}</span>
            </div>
            <div className="col-span-3 flex items-center gap-2 text-slate-400">
              <Folder size={14} />
              {doc.folder}
            </div>
            <div className="col-span-2 flex items-center gap-2 text-slate-400 text-sm">
              <Clock size={14} />
              {doc.lastEdited}
            </div>
            <div className="col-span-1 flex items-center gap-2 text-slate-400 text-sm">
              <User size={14} />
              {doc.author}
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No documents found</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Getting Started Guide"
          description="Learn how to use Mission Control"
          icon="📖"
        />
        <QuickActionCard
          title="Meeting Notes"
          description="Templates for our sync meetings"
          icon="📝"
        />
        <QuickActionCard
          title="Project Templates"
          description="Reusable project structures"
          icon="📋"
        />
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  )
}
