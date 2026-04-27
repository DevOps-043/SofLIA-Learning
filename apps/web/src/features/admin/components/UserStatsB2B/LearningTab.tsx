'use client'

import { BarChart3, Calendar, CheckCircle, Clock, PieChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLearningStats } from '../../hooks/useUserStatsB2B'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { BarChartComponent, EmptyState, GroupedBarChartComponent, PieChartComponent } from './charts'
import {
  UserStatsChartCard,
  UserStatsErrorState,
  UserStatsLoadingState,
  UserStatsMetricCard,
} from './UserStatsTabPrimitives'

export function LearningTab() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { data: stats, isLoading, error } = useLearningStats()

  if (isLoading) {
    return <UserStatsLoadingState />
  }

  if (error) {
    return <UserStatsErrorState message={t('userStatsPage.errors.learning')} />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <UserStatsMetricCard
          label={t('userStatsPage.learning.avgTimePerLesson')}
          value={t('userStatsPage.learning.minutesValue', { value: stats?.avgTimePerLesson ?? 0 })}
          icon={Clock}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.learning.quizPassRate')}
          value={`${stats?.quizPassRate ?? 0}%`}
          icon={CheckCircle}
        />
        <UserStatsMetricCard
          label={t('userStatsPage.learning.avgSessionsPerWeek')}
          value={stats?.avgSessionsPerWeek ?? 0}
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserStatsChartCard title={t('userStatsPage.learning.topCoursesByTime')} icon={BarChart3}>
          {stats?.topCoursesByTime && stats.topCoursesByTime.length > 0 ? (
            <BarChartComponent data={stats.topCoursesByTime} dataKey="minutes" nameKey="course" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.learning.sessionsPlannedVsCompleted')} icon={BarChart3}>
          {stats?.sessionsPlannedVsCompleted && stats.sessionsPlannedVsCompleted.length > 0 ? (
            <GroupedBarChartComponent
              data={stats.sessionsPlannedVsCompleted}
              nameKey="week"
              keys={[
                {
                  key: 'planned',
                  label: t('userStatsPage.learning.planned'),
                  color: theme.chartColors[0],
                },
                {
                  key: 'completed',
                  label: t('userStatsPage.learning.completed'),
                  color: theme.chartColors[1],
                },
              ]}
            />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.learning.timeByContentType')} icon={PieChart}>
          {stats?.timeByContentType && stats.timeByContentType.length > 0 ? (
            <PieChartComponent data={stats.timeByContentType} dataKey="minutes" nameKey="type" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>

        <UserStatsChartCard title={t('userStatsPage.learning.streakDistribution')} icon={BarChart3}>
          {stats?.streakDistribution && stats.streakDistribution.some((item) => item.count > 0) ? (
            <BarChartComponent data={stats.streakDistribution} dataKey="count" nameKey="range" />
          ) : (
            <EmptyState />
          )}
        </UserStatsChartCard>
      </div>
    </div>
  )
}
