'use client'

import { BarChart3, Globe, RefreshCw, Star, UserCheck, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useEngagementStats } from '../../hooks/useUserStatsB2B'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { BarChartComponent, EmptyState, GroupedBarChartComponent } from './charts'
import {
  UserStatsChartCard,
  UserStatsErrorState,
  UserStatsLoadingState,
  UserStatsMetricCard,
} from './UserStatsTabPrimitives'

export function EngagementTab() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { data: stats, isLoading, error } = useEngagementStats()

  if (isLoading) {
    return <UserStatsLoadingState />
  }

  if (error) {
    return <UserStatsErrorState message={t('userStatsPage.errors.engagement')} />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UserStatsMetricCard
          label={t('userStatsPage.engagement.activationRate')}
          value={`${stats?.activationRate ?? 0}%`}
          icon={UserCheck}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.engagement.weeklyReturn')}
          value={`${stats?.weeklyReturn ?? 0}%`}
          icon={RefreshCw}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.engagement.avgSatisfaction')}
          value={`${stats?.avgSatisfaction ?? 0}/5`}
          icon={Star}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.engagement.inactiveUsers30d')}
          value={stats?.inactiveUsers30d ?? 0}
          icon={UserX}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStatsPage.engagement.newVsRecurring')} icon={BarChart3}>
          {stats?.newVsRecurring && stats.newVsRecurring.length > 0 ? (
            <GroupedBarChartComponent
              data={stats.newVsRecurring}
              nameKey="week"
              keys={[
                { key: 'new', label: t('userStatsPage.engagement.new'), color: theme.chartColors[0] },
                { key: 'recurring', label: t('userStatsPage.engagement.recurring'), color: theme.chartColors[1] },
              ]}
            />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.engagement.ratingDistribution')} icon={Star}>
          {stats?.ratingDistribution && stats.ratingDistribution.some((item) => item.count > 0) ? (
            <BarChartComponent
              data={stats.ratingDistribution.map((item) => ({
                ...item,
                label: t('userStatsPage.engagement.ratingLabel', {
                  count: item.rating,
                  plural: item.rating > 1 ? 's' : '',
                }),
              }))}
              dataKey="count"
              nameKey="label"
            />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.engagement.engagementByOrg')} icon={BarChart3}>
          {stats?.engagementByOrg && stats.engagementByOrg.length > 0 ? (
            <BarChartComponent data={stats.engagementByOrg} dataKey="ratio" nameKey="org" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.engagement.usersByCountry')} icon={Globe}>
          {stats?.usersByCountry && stats.usersByCountry.length > 0 ? (
            <BarChartComponent data={stats.usersByCountry} dataKey="count" nameKey="country" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>
      </div>
    </div>
  )
}
