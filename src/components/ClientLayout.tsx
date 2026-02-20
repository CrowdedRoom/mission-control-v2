'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlobalSearch } from './GlobalSearch'

type Props = {
  children: React.ReactNode
}

// Custom event for opening search from anywhere
export const OPEN_SEARCH_EVENT = 'open-global-search'

export function ClientLayout({ children }: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsSearchOpen(true)
    }
  }, [])

  // Listen for custom event from Navigation
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true)
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch)
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch)
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      {children}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

// Helper to open search programmatically
export function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
}
