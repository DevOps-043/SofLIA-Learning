'use client'

import { LayoutGrid, List } from 'lucide-react'
import type { ReactElement } from 'react'
import type { TFunction } from 'i18next'
import type { UserManagementViewMode, UsersFilterBarTheme } from './users-filter-bar.types'
import styles from '../UsersPanel.module.css'

type ViewModeToggleProps = { setViewMode: (mode: UserManagementViewMode) => void; t: TFunction; theme: UsersFilterBarTheme; viewMode: UserManagementViewMode }

export function ViewModeToggle({ setViewMode, t, viewMode }: ViewModeToggleProps) {
  return (
    <div className={styles.viewToggle} aria-label={t('users.view.label', 'Modo de visualización')}>
      <ViewModeButton active={viewMode === 'cards'} icon={<LayoutGrid />} label={t('users.view.cards')} onClick={() => setViewMode('cards')} />
      <ViewModeButton active={viewMode === 'list'} icon={<List />} label={t('users.view.list')} onClick={() => setViewMode('list')} />
    </div>
  )
}

function ViewModeButton({ active, icon, label, onClick }: { active: boolean; icon: ReactElement; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.viewButton} ${active ? styles.viewButtonActive : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  )
}
