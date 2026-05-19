'use client'

import { BarChart3, Calendar, CheckCircle, Clock, PieChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import { useLearningStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, GroupedBarChartComponent, PieChartComponent } from './charts'
import { UserStatsChartCard } from './shared/UserStatsChartCard'
import { UserStatsErrorState } from './shared/UserStatsErrorState'
import { UserStatsLoadingState } from './shared/UserStatsLoadingState'
import { UserStatsMetricCard } from './shared/UserStatsMetricCard'

export function LearningTab() {
  const { t } = useTranslation('admin')
  const { data, isLoading, error } = useLearningStats()

  if (isLoading) return <UserStatsLoadingState />
  if (error) return <UserStatsErrorState message={t('userStats.errors.learning')} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <UserStatsMetricCard label={t('userStats.metrics.avgTimePerLesson')} value={`${data?.avgTimePerLesson ?? 0} min`} icon={Clock} accentColor="var(--color-info)" />
        <UserStatsMetricCard label={t('userStats.metrics.quizPassRate')} value={`${data?.quizPassRate ?? 0}%`} icon={CheckCircle} accentColor="var(--color-success)" />
        <UserStatsMetricCard label={t('userStats.metrics.avgSessionsPerWeek')} value={data?.avgSessionsPerWeek ?? 0} icon={Calendar} accentColor="var(--color-secondary)" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStats.charts.topCoursesByTime')} icon={BarChart3}>
          <BarChartComponent data={data?.topCoursesByTime ?? []} dataKey="minutes" nameKey="course" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.sessionsPlannedVsCompleted')} icon={BarChart3}>
          <GroupedBarChartComponent
            data={data?.sessionsPlannedVsCompleted ?? []}
            nameKey="week"
            keys={[
              { key: 'planned', label: t('userStats.legend.planned'), color: SOFLIA_ADMIN_COLORS.info },
              { key: 'completed', label: t('userStats.legend.completed'), color: SOFLIA_ADMIN_COLORS.success },
            ]}
          />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.timeByContentType')} icon={PieChart}>
          <PieChartComponent data={data?.timeByContentType ?? []} dataKey="minutes" nameKey="type" />
        </UserStatsChartCard>
        <UserStatsChartCard title={t('userStats.charts.streakDistribution')} icon={BarChart3}>
          <BarChartComponent data={data?.streakDistribution ?? []} dataKey="count" nameKey="range" />
        </UserStatsChartCard>
      </div>
    </div>
  )
}
