'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  Rocket
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Documents', href: '/docs', icon: FileText },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-3xl">🦝</span>
          <div>
            <h1 className="font-bold text-slate-100">Mission Control</h1>
            <p className="text-xs text-slate-400">DJ & Larry</p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          )
        })}
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
  )
}
