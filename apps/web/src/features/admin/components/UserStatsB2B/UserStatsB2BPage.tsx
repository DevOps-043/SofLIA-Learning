'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { EngagementTab } from './EngagementTab'
import { LearningTab } from './LearningTab'
import { OverviewTab } from './OverviewTab'
import { UserDetailTab } from './UserDetailTab'
import { UserStatsPageHeader } from './shared/UserStatsPageHeader'
import { USER_STATS_TABS } from './shared/user-stats-tabs'
import type { UserStatsTab } from './types'

export function UserStatsB2BPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const [activeTab, setActiveTab] = useState<UserStatsTab>('overview')

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <UserStatsPageHeader />

      <div
        className="flex gap-2 overflow-x-auto rounded-[24px] border p-2"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      >
        {USER_STATS_TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
            style={activeTab === id
              ? { backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }
              : { backgroundColor: 'transparent', color: theme.subtextColor }}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'learning' && <LearningTab />}
      {activeTab === 'engagement' && <EngagementTab />}
      {activeTab === 'users' && <UserDetailTab />}
    </div>
  )
}
