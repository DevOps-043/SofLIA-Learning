'use client'

import { BookOpen, LayoutDashboard, Map, MessageSquare, Users } from 'lucide-react'
import type { NodeDashboardCommonProps, NodeDashboardTab } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

const tabs: Array<{ id: NodeDashboardTab; icon: typeof LayoutDashboard }> = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'members', icon: Users },
  { id: 'structure', icon: Map },
  { id: 'learning', icon: BookOpen },
  { id: 'chat', icon: MessageSquare },
]

export function NodeDashboardTabs({ state, t }: NodeDashboardCommonProps) {
  return (
    <nav className={styles.dashboardTabs} role="tablist" aria-label={t('hierarchy.pageTitle')}>
      {tabs.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={state.activeTab === id}
          onClick={() => state.setActiveTab(id)}
          className={`${styles.dashboardTab} ${state.activeTab === id ? styles.dashboardTabActive : ''}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {t(`hierarchy.dashboard.tabs.${id}`)}
        </button>
      ))}
    </nav>
  )
}
