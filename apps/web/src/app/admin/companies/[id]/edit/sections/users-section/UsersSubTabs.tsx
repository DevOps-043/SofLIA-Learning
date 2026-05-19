'use client'

import type { CompanyUsersSubTab } from './types'

const SUB_TABS: Array<{ id: CompanyUsersSubTab; label: string }> = [
  { id: 'members', label: 'Miembros' },
  { id: 'invitations', label: 'Invitaciones Individuales' },
  { id: 'links', label: 'Enlaces de Invitación' },
]

export function UsersSubTabs({
  activeSubTab,
  onChange,
}: {
  activeSubTab: CompanyUsersSubTab
  onChange: (tab: CompanyUsersSubTab) => void
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 p-1 dark:border-white/5">
      {SUB_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === tab.id
              ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
