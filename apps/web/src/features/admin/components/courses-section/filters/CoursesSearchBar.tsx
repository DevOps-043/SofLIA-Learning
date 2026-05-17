'use client'

import { Search } from 'lucide-react'
import { colors } from '../courses-section.types'

interface CoursesSearchBarProps {
  activeTab: 'org' | 'users'
  listSearch: string
  setListSearch: (v: string) => void
}

export function CoursesSearchBar({ activeTab, listSearch, setListSearch }: CoursesSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.grayMedium }} />
      <input
        placeholder={activeTab === 'org' ? 'Buscar en catálogo adquirido...' : 'Buscar por usuario o curso...'}
        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm text-white focus:outline-none transition-all shadow-sm"
        style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
        value={listSearch}
        onChange={(e) => setListSearch(e.target.value)}
      />
    </div>
  )
}
