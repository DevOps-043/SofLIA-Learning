'use client'

import { Users, BookOpen, CheckCircle, Clock, TrendingUp, Award, UserCheck, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { KPICard, SmallMetricCard } from './shared'
import type { BusinessAnalyticsOverviewProps } from './types'

export function BusinessAnalyticsOverview({
  data,
  accentColor,
}: BusinessAnalyticsOverviewProps) {
  const { t } = useTranslation('business')

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label={t('analytics.kpis.totalUsers')}
          value={data.general_metrics.total_users}
          color={accentColor}
        />
        <KPICard
          icon={BookOpen}
          label={t('analytics.kpis.assignedCourses')}
          value={data.general_metrics.total_courses_assigned}
          color="#8b5cf6"
        />
        <KPICard
          icon={CheckCircle}
          label={t('analytics.kpis.completed')}
          value={data.general_metrics.completed_courses}
          color="#10b981"
        />
        <KPICard
          icon={TrendingUp}
          label={t('analytics.kpis.avgProgress')}
          value={`${data.general_metrics.average_progress}%`}
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallMetricCard
          icon={Clock}
          label={t('analytics.kpis.totalTime')}
          value={`${data.general_metrics.total_time_hours}h`}
          color={accentColor}
        />
        <SmallMetricCard
          icon={Award}
          label={t('analytics.kpis.certificates')}
          value={data.general_metrics.total_certificates}
          color="#8b5cf6"
        />
        <SmallMetricCard
          icon={UserCheck}
          label={t('analytics.kpis.activeUsers')}
          value={data.general_metrics.active_users}
          color="#10b981"
        />
        <SmallMetricCard
          icon={Target}
          label={t('analytics.kpis.retentionRate')}
          value={`${data.general_metrics.retention_rate}%`}
          color="#f59e0b"
        />
      </div>
    </motion.div>
  )
}
