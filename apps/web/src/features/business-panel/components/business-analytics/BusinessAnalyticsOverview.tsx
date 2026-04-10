'use client'

import { Users, BookOpen, CheckCircle, Clock, TrendingUp, Award, UserCheck, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { KPICard, SmallMetricCard } from './shared'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessAnalyticsOverviewProps } from './types'

export function BusinessAnalyticsOverview({
  data,
}: BusinessAnalyticsOverviewProps) {
  const { t } = useTranslation('business')
  const { actionColor, brandColor, secondaryColor, successColor, warningColor } =
    useBusinessPanelTheme()

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
          color={actionColor}
        />
        <KPICard
          icon={BookOpen}
          label={t('analytics.kpis.assignedCourses')}
          value={data.general_metrics.total_courses_assigned}
          color={brandColor}
        />
        <KPICard
          icon={CheckCircle}
          label={t('analytics.kpis.completed')}
          value={data.general_metrics.completed_courses}
          color={successColor}
        />
        <KPICard
          icon={TrendingUp}
          label={t('analytics.kpis.avgProgress')}
          value={`${data.general_metrics.average_progress}%`}
          color={warningColor}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallMetricCard
          icon={Clock}
          label={t('analytics.kpis.totalTime')}
          value={`${data.general_metrics.total_time_hours}h`}
          color={actionColor}
        />
        <SmallMetricCard
          icon={Award}
          label={t('analytics.kpis.certificates')}
          value={data.general_metrics.total_certificates}
          color={secondaryColor}
        />
        <SmallMetricCard
          icon={UserCheck}
          label={t('analytics.kpis.activeUsers')}
          value={data.general_metrics.active_users}
          color={successColor}
        />
        <SmallMetricCard
          icon={Target}
          label={t('analytics.kpis.retentionRate')}
          value={`${data.general_metrics.retention_rate}%`}
          color={warningColor}
        />
      </div>
    </motion.div>
  )
}
