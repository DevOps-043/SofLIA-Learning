'use client'

import { BarChart3, Globe, RefreshCw, Star, UserCheck, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import { useEngagementStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, GroupedBarChartComponent } from './charts'
import { UserStatsChartCard } from './shared/UserStatsChartCard'
import { UserStatsErrorState } from './shared/UserStatsErrorState'
import { UserStatsLoadingState } from './shared/UserStatsLoadingState'
import { UserStatsMetricCard } from './shared/UserStatsMetricCard'

export function EngagementTab() {
  const { t } = useTranslation('admin')
  const { data, isLoading, error } = useEngagementStats()

  if (isLoading) return <UserStatsLoadingState />
  if (error) return <UserStatsErrorState message={t('userStats.errors.engagement')} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UserStatsMetricCard label={t('userStats.metrics.activationRate')} value={`${data?.activationRate ?? 0}%`} icon={UserCheck} accentColor="var(--color-info)" />
        <UserStatsMetricCard label={t('userStats.metrics.weeklyReturn')} value={`${data?.weeklyReturn ?? 0}%`} icon={RefreshCw} accentColor="var(--color-success)" />
        <UserStatsMetricCard label={t('userStats.metrics.avgSatisfaction')} value={`${data?.avgSatisfaction ?? 0}/5`} icon={Star} accentColor="var(--color-warning)" />
        <UserStatsMetricCard label={t('userStats.metrics.inactiveUsers30d')} value={data?.inactiveUsers30d ?? 0} icon={UserX} accentColor="var(--color-error)" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStats.charts.newVsRecurring')} icon={BarChart3}>
          <GroupedBarChartComponent
            data={data?.newVsRecurring ?? []}
            nameKey="week"
            keys={[
              { key: 'new', label: t('userStats.legend.new'), color: SOFLIA_ADMIN_COLORS.info },
              { key: 'recurring', label: t('userStats.legend.recurring'), color: SOFLIA_ADMIN_COLORS.success },
            ]}
          />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.ratingDistribution')} icon={Star}>
          <BarChartComponent
            data={(data?.ratingDistribution ?? []).map((item) => ({ ...item, label: t('userStats.ratingLabel', { count: item.rating }) }))}
            dataKey="count"
            nameKey="label"
          />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.engagementByOrg')} icon={BarChart3}>
          <BarChartComponent data={data?.engagementByOrg ?? []} dataKey="ratio" nameKey="org" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.usersByCountry')} icon={Globe}>
          <BarChartComponent data={data?.usersByCountry ?? []} dataKey="count" nameKey="country" />
        </UserStatsChartCard>
      </div>
    </div>
  )
}
