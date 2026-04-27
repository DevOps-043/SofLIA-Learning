'use client'

import { motion } from 'framer-motion'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminStats } from '../../hooks/useAdminStats'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminMetricCard, AdminSurface } from '../ui'

interface StatCardData {
  id: string
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: typeof UsersIcon
}

export function StatsCardsWidget() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { stats: dbStats, isLoading } = useAdminStats()

  const statsList: StatCardData[] = dbStats
    ? [
        {
          id: 'total-users',
          title: t('statisticsWidgets.statsCards.totalUsers'),
          value: dbStats.totalUsers.toLocaleString(),
          change: `${dbStats.userGrowth >= 0 ? '+' : ''}${dbStats.userGrowth}%`,
          changeType: dbStats.userGrowth >= 0 ? 'increase' : 'decrease',
          icon: UsersIcon,
        },
        {
          id: 'active-courses',
          title: t('statisticsWidgets.statsCards.activeCourses'),
          value: dbStats.activeCourses.toLocaleString(),
          change: `${dbStats.courseGrowth >= 0 ? '+' : ''}${dbStats.courseGrowth}%`,
          changeType: dbStats.courseGrowth >= 0 ? 'increase' : 'decrease',
          icon: BookOpenIcon,
        },
        {
          id: 'communities',
          title: t('statisticsWidgets.statsCards.communities'),
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: UserGroupIcon,
        },
        {
          id: 'ai-apps',
          title: t('statisticsWidgets.statsCards.aiApps'),
          value: dbStats.totalAIApps.toLocaleString(),
          change: `${dbStats.aiAppGrowth >= 0 ? '+' : ''}${dbStats.aiAppGrowth}%`,
          changeType: dbStats.aiAppGrowth >= 0 ? 'increase' : 'decrease',
          icon: CpuChipIcon,
        },
        {
          id: 'prompts',
          title: t('statisticsWidgets.statsCards.prompts'),
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: ChatBubbleLeftRightIcon,
        },
        {
          id: 'news',
          title: t('statisticsWidgets.statsCards.news'),
          value: dbStats.totalNews.toLocaleString(),
          change: `${dbStats.newsGrowth >= 0 ? '+' : ''}${dbStats.newsGrowth}%`,
          changeType: dbStats.newsGrowth >= 0 ? 'increase' : 'decrease',
          icon: NewspaperIcon,
        },
      ]
    : []

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <AdminSurface key={index} className="h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {statsList.map((stat, index) => {
        const TrendIcon = stat.changeType === 'increase' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <AdminMetricCard
              icon={stat.icon}
              label={stat.title}
              value={stat.value}
              tone="info"
              description={
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: stat.changeType === 'increase' ? theme.action : theme.danger }}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {stat.change}
                </span>
              }
            />
          </motion.div>
        )
      })}
    </div>
  )
}
