'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  FileText,
  Brain,
  BookOpen,
  Users,
  Settings,
  Zap,
  Rocket,
  Menu,
  X,
  Activity,
  Search
} from 'lucide-react'
import { openGlobalSearch } from './ClientLayout'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: Rocket },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Memory', href: '/memory', icon: BookOpen },
  { name: 'Documents', href: '/docs', icon: FileText },
  { name: 'Brain Dump', href: '/capture', icon: Brain },
  { name: 'Audit', href: '/audit', icon: Zap },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦝</span>
            <span className="font-bold text-slate-100">Mission Control</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay - positioned to not overlap sidebar */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-y-0 left-64 right-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-700
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
        pt-16 lg:pt-0
      `}>
        {/* Logo - Desktop only */}
        <div className="hidden lg:block p-4 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🦝</span>
            <div>
              <h1 className="font-bold text-slate-100">Mission Control</h1>
              <p className="text-xs text-slate-400">DJ & Larry</p>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 lg:py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} className="lg:w-[18px] lg:h-[18px]" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Search Shortcut */}
        <div className="px-4 pb-2">
          <button
            onClick={openGlobalSearch}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 rounded border border-slate-600">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Rocket size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-slate-300">Status</span>
            </div>
            <p className="text-xs text-slate-400">All systems operational</p>
          </div>
        </div>
      </nav>
    </>
  )
}
