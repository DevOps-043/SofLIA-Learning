'use client'

import { Search } from 'lucide-react'

interface CoursesSearchBarProps {
  activeTab: 'org' | 'users'
  listSearch: string
  setListSearch: (v: string) => void
}

export function CoursesSearchBar({ activeTab, listSearch, setListSearch }: CoursesSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
      <input
        placeholder={activeTab === 'org' ? 'Buscar en catálogo adquirido...' : 'Buscar por usuario o curso...'}
        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm focus:outline-none transition-all shadow-sm bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-primary/40 dark:bg-white/[0.04] dark:text-white dark:placeholder-white/40 dark:border-white/10 dark:focus:border-accent/40"
        value={listSearch}
        onChange={(e) => setListSearch(e.target.value)}
      />
    </div>
  )
}
