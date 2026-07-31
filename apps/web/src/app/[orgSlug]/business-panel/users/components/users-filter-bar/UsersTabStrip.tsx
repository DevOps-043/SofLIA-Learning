'use client'

import type { UserManagementTab, UsersFilterBarTheme } from './users-filter-bar.types'
import styles from '../UsersPanel.module.css'

type UsersTabStripProps = {
  activeTab: UserManagementTab
  setActiveTab: (tab: UserManagementTab) => void
  tabs: Array<{ key: UserManagementTab; label: string; count: number }>
  theme: UsersFilterBarTheme
}

export function UsersTabStrip({ activeTab, setActiveTab, tabs }: UsersTabStripProps) {
  return (
    <div className={styles.tabStrip} role="tablist" aria-label="Secciones de gestión de usuarios">
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => setActiveTab(key)}
          className={`${styles.tabButton} ${activeTab === key ? styles.tabButtonActive : ''}`}
        >
          {label}
          <span className={styles.tabCount}>{count}</span>
        </button>
      ))}
    </div>
  )
}
