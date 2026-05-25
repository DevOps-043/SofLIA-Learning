'use client'

import { LayoutGrid, List } from 'lucide-react'
import type { ReactElement } from 'react'
import type { TFunction } from 'i18next'
import type { UserManagementViewMode, UsersFilterBarTheme } from './users-filter-bar.types'

type ViewModeToggleProps = { setViewMode: (mode: UserManagementViewMode) => void; t: TFunction; theme: UsersFilterBarTheme; viewMode: UserManagementViewMode }

export function ViewModeToggle({ setViewMode, t, theme, viewMode }: ViewModeToggleProps) {
  return (
    <div className="flex items-center overflow-hidden rounded-xl border-2" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}>
      <ViewModeButton active={viewMode === 'cards'} icon={<LayoutGrid />} label={t('users.view.cards')} onClick={() => setViewMode('cards')} theme={theme} />
      <div className="h-6 w-px" style={{ backgroundColor: theme.dividerColor }} />
      <ViewModeButton active={viewMode === 'list'} icon={<List />} label={t('users.view.list')} onClick={() => setViewMode('list')} theme={theme} />
    </div>
  )
}

function ViewModeButton({ active, icon, label, onClick, theme }: { active: boolean; icon: ReactElement; label: string; onClick: () => void; theme: UsersFilterBarTheme }) {
  return <button onClick={onClick} className="p-3.5 transition-all" style={{ backgroundColor: active ? `color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)` : 'transparent' }} title={label}>{icon && <span className="block [&>svg]:h-5 [&>svg]:w-5" style={{ color: active ? theme.primaryColor : theme.mutedTextColor }}>{icon}</span>}</button>
}
