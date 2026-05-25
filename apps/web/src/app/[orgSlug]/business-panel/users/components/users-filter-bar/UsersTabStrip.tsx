'use client'

import type { UserManagementTab, UsersFilterBarTheme } from './users-filter-bar.types'

type UsersTabStripProps = {
  activeTab: UserManagementTab
  setActiveTab: (tab: UserManagementTab) => void
  tabs: Array<{ key: UserManagementTab; label: string; count: number }>
  theme: UsersFilterBarTheme
}

export function UsersTabStrip({ activeTab, setActiveTab, tabs, theme }: UsersTabStripProps) {
  return (
    <div className="scrollbar-hide flex max-w-full items-center overflow-x-auto rounded-xl p-1" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.borderColor}`, WebkitOverflowScrolling: 'touch' }}>
      {tabs.map(({ key, label, count }) => (
        <button key={key} onClick={() => setActiveTab(key)} className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all sm:px-6 sm:text-sm ${activeTab === key ? 'shadow-lg' : theme.isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`} style={{ backgroundColor: activeTab === key ? theme.primaryColor : 'transparent', color: activeTab === key ? theme.onPrimaryColor : undefined }}>
          {label}<span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] sm:ml-2 sm:px-2 ${activeTab === key ? 'bg-white/20' : theme.isDark ? 'bg-white/10' : 'bg-black/5'}`}>{count}</span>
        </button>
      ))}
    </div>
  )
}
