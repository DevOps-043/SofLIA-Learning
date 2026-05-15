'use client'

import { BookOpen, Clock, PlayCircle, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessPanelStatCard } from '@/features/business-panel/components/shared/BusinessPanelStatCard'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { WorkshopStats } from '../../services/adminWorkshops.service'

interface AdminWorkshopsStatsGridProps {
  stats: WorkshopStats | null
}

export function AdminWorkshopsStatsGrid({
  stats,
}: AdminWorkshopsStatsGridProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const items = [
    {
      title: t('workshops.stats.totalWorkshops'),
      value: stats?.totalWorkshops ?? 0,
      iconColor: theme.primaryColor,
      icon: <BookOpen className="h-full w-full" />,
    },
    {
      title: t('workshops.stats.active'),
      value: stats?.activeWorkshops ?? 0,
      iconColor: theme.successColor,
      icon: <PlayCircle className="h-full w-full" />,
    },
    {
      title: t('workshops.stats.totalStudents'),
      value: stats?.totalStudents ?? 0,
      iconColor: theme.secondaryColor,
      icon: <Users className="h-full w-full" />,
    },
    {
      title: t('workshops.stats.averageDuration'),
      value: `${stats?.averageDuration ?? 0} min`,
      iconColor: theme.warningColor,
      icon: <Clock className="h-full w-full" />,
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <BusinessPanelStatCard
          key={item.title}
          title={item.title}
          value={item.value}
          iconColor={item.iconColor}
          icon={item.icon}
          delay={index}
          compact
        />
      ))}
    </div>
  )
}
