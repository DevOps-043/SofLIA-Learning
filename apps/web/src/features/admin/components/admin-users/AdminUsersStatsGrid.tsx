'use client'

import { BadgeCheck, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import type { TFunction } from 'i18next'
import { BusinessPanelStatCard } from '@/features/business-panel/components/shared/BusinessPanelStatCard'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { UserStats } from '../../services/adminUsers.service'

interface AdminUsersStatsGridProps {
  stats: UserStats | null
  t: TFunction<'admin'>
}

export function AdminUsersStatsGrid({ stats, t }: AdminUsersStatsGridProps) {
  const theme = useAdminPanelTheme()

  const items = [
    {
      title: t('users.page.stats.total'),
      value: stats?.totalUsers ?? 0,
      iconColor: theme.primaryColor,
      icon: <Users className="h-full w-full" />,
    },
    {
      title: t('users.page.stats.verified'),
      value: stats?.verifiedUsers ?? 0,
      iconColor: theme.successColor,
      icon: <BadgeCheck className="h-full w-full" />,
    },
    {
      title: t('users.page.stats.instructors'),
      value: stats?.instructors ?? 0,
      iconColor: theme.warningColor,
      icon: <GraduationCap className="h-full w-full" />,
    },
    {
      title: t('users.page.stats.admins'),
      value: stats?.administrators ?? 0,
      iconColor: theme.secondaryColor,
      icon: <ShieldCheck className="h-full w-full" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
