'use client'

import { useState } from 'react'
import { BarChart3, BookOpen, Activity, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { UserStatsTab } from './types'
import { OverviewTab } from './OverviewTab'
import { LearningTab } from './LearningTab'
import { EngagementTab } from './EngagementTab'
import { UserDetailTab } from './UserDetailTab'
import { AdminPageShell, AdminSectionHeader, AdminTabs } from '../ui'

export function UserStatsB2BPage() {
  const { t } = useTranslation('admin')
  const [activeTab, setActiveTab] = useState<UserStatsTab>('overview')

  const tabs: { value: UserStatsTab; label: string; icon: typeof BarChart3 }[] = [
    { value: 'overview', label: t('userStatsPage.tabs.overview'), icon: BarChart3 },
    { value: 'learning', label: t('userStatsPage.tabs.learning'), icon: BookOpen },
    { value: 'engagement', label: t('userStatsPage.tabs.engagement'), icon: Activity },
    { value: 'users', label: t('userStatsPage.tabs.users'), icon: Users },
  ]

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-6">
        <AdminSectionHeader
          size="page"
          icon={Users}
          kicker={t('navigation.userStats')}
          title={t('userStatsPage.title')}
          description={t('userStatsPage.description')}
        />

        <AdminTabs value={activeTab} onChange={setActiveTab} tabs={tabs} />

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'learning' && <LearningTab />}
        {activeTab === 'engagement' && <EngagementTab />}
        {activeTab === 'users' && <UserDetailTab />}
      </div>
    </AdminPageShell>
  )
}
