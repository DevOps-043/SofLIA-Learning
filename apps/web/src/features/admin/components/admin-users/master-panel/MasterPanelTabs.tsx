'use client'

import { BarChart3, BookOpen, Building2, Fingerprint, Route, ShieldCheck, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { AdminPanelThemeTokens } from '../../../hooks/useAdminPanelTheme'
import { MASTER_PANEL_TABS, type MasterPanelTab } from './types'

const TAB_ICONS: Record<MasterPanelTab, typeof User> = {
  profile: User,
  account: ShieldCheck,
  organizations: Building2,
  courses: BookOpen,
  learningPaths: Route,
  stats: BarChart3,
  audit: Fingerprint,
}

interface MasterPanelTabsProps {
  activeTab: MasterPanelTab
  theme: AdminPanelThemeTokens
  onTabChange: (tab: MasterPanelTab) => void
}

export function MasterPanelTabs({ activeTab, theme, onTabChange }: MasterPanelTabsProps) {
  const { t } = useTranslation('admin')

  return (
    <div
      className="flex flex-shrink-0 gap-1 overflow-x-auto border-b px-4 py-2"
      style={{ borderColor: theme.borderColor }}
    >
      {MASTER_PANEL_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab]
        const isActive = tab === activeTab
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className="relative flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: isActive ? theme.actionColor : theme.subtextColor,
              backgroundColor: isActive ? theme.actionSurface : 'transparent',
            }}
          >
            <Icon className="h-4 w-4" />
            {t(`users.masterPanel.tabs.${tab}`)}
            {isActive ? (
              <motion.span
                layoutId="master-panel-tab-underline"
                className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full"
                style={{ backgroundColor: theme.actionColor }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
