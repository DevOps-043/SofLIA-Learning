'use client'

import { Award, BarChart3, CheckCircle, Clock, PieChart, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useOverviewStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, EmptyState, PieChartComponent } from './charts'
import {
  UserStatsChartCard,
  UserStatsErrorState,
  UserStatsLoadingState,
  UserStatsMetricCard,
} from './UserStatsTabPrimitives'

export function OverviewTab() {
  const { t } = useTranslation('admin')
  const { data: stats, isLoading, error } = useOverviewStats()

  if (isLoading) {
    return <UserStatsLoadingState />
  }

  if (error) {
    return <UserStatsErrorState message={t('userStatsPage.errors.overview')} />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UserStatsMetricCard
          label={t('userStatsPage.overview.activeUsers30d')}
          value={stats?.activeUsers30d ?? 0}
          icon={Users}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.overview.completionRate')}
          value={`${stats?.completionRate ?? 0}%`}
          icon={CheckCircle}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.overview.studyHoursMonth')}
          value={stats?.studyHoursMonth ?? 0}
          icon={Clock}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.overview.certificatesMonth')}
          value={stats?.certificatesMonth ?? 0}
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStatsPage.overview.usersByOrganization')} icon={PieChart}>
          {stats?.usersByOrganization && stats.usersByOrganization.length > 0 ? (
            <PieChartComponent data={stats.usersByOrganization} dataKey="count" nameKey="name" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.overview.dailyActivity')} icon={BarChart3}>
          {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
            <BarChartComponent data={stats.dailyActivity} dataKey="count" nameKey="date" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.overview.progressDistribution')} icon={PieChart}>
          {stats?.progressDistribution && stats.progressDistribution.some((item) => item.count > 0) ? (
            <PieChartComponent data={stats.progressDistribution} dataKey="count" nameKey="range" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.overview.roleDistribution')} icon={PieChart}>
          {stats?.roleDistribution && stats.roleDistribution.length > 0 ? (
            <PieChartComponent data={stats.roleDistribution} dataKey="count" nameKey="role" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>
      </div>
    </div>
  )
}
