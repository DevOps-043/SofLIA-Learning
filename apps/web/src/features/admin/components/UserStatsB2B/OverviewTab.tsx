'use client'

import { Award, BarChart3, CheckCircle, Clock, PieChart, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOverviewStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, PieChartComponent } from './charts'
import { UserStatsChartCard } from './shared/UserStatsChartCard'
import { UserStatsErrorState } from './shared/UserStatsErrorState'
import { UserStatsLoadingState } from './shared/UserStatsLoadingState'
import { UserStatsMetricCard } from './shared/UserStatsMetricCard'

export function OverviewTab() {
  const { t } = useTranslation('admin')
  const { data, isLoading, error } = useOverviewStats()

  if (isLoading) return <UserStatsLoadingState />
  if (error) return <UserStatsErrorState message={t('userStats.errors.overview')} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UserStatsMetricCard label={t('userStats.metrics.activeUsers30d')} value={data?.activeUsers30d ?? 0} icon={Users} accentColor="var(--color-info)" />
        <UserStatsMetricCard label={t('userStats.metrics.completionRate')} value={`${data?.completionRate ?? 0}%`} icon={CheckCircle} accentColor="var(--color-success)" />
        <UserStatsMetricCard label={t('userStats.metrics.studyHoursMonth')} value={data?.studyHoursMonth ?? 0} icon={Clock} accentColor="var(--color-secondary)" />
        <UserStatsMetricCard label={t('userStats.metrics.certificatesMonth')} value={data?.certificatesMonth ?? 0} icon={Award} accentColor="var(--color-warning)" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStats.charts.usersByOrganization')} icon={PieChart}>
          <PieChartComponent data={data?.usersByOrganization ?? []} dataKey="count" nameKey="name" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.dailyActivity')} icon={BarChart3}>
          <BarChartComponent data={data?.dailyActivity ?? []} dataKey="count" nameKey="date" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.progressDistribution')} icon={PieChart}>
          <PieChartComponent data={data?.progressDistribution ?? []} dataKey="count" nameKey="range" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.roleDistribution')} icon={PieChart}>
          <PieChartComponent data={data?.roleDistribution ?? []} dataKey="count" nameKey="role" />
        </UserStatsChartCard>
      </div>
    </div>
  )
}
