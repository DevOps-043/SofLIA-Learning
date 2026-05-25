'use client'

import { CheckCircle, Mail, Shield, UserPlus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatCard } from './StatCard'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface UsersStatsGridProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function UsersStatsGrid({ logic, theme }: UsersStatsGridProps) {
  const { t } = useTranslation('business')

  return (
    <div
      id="tour-users-stats"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <StatCard
        title={t('users.stats.total')}
        value={logic.stats.total}
        icon={<Users className="h-5 w-5" />}
        iconColor={theme.brandColor}
        delay={0}
        trend={12}
      />
      <StatCard
        title={t('users.stats.active')}
        value={logic.stats.active}
        icon={<CheckCircle className="h-5 w-5" />}
        iconColor={theme.successColor}
        delay={1}
        trend={8}
      />
      <StatCard
        title={t('users.stats.invited')}
        value={logic.stats.invited}
        icon={<Mail className="h-5 w-5" />}
        iconColor={theme.warningColor}
        delay={2}
        onClick={() => logic.setActiveTab('invitations')}
      />
      <StatCard
        title={t('users.stats.admins')}
        value={logic.stats.admins}
        icon={<Shield className="h-5 w-5" />}
        iconColor={theme.secondaryColor}
        delay={3}
        trend={5}
      />
      <StatCard
        title={t('sidebar.joinRequests', 'Solicitudes')}
        value={logic.joinRequestsCount}
        icon={<UserPlus className="h-5 w-5" />}
        iconColor={theme.actionColor}
        delay={4}
        onClick={() => logic.setActiveTab('requests')}
      />
    </div>
  )
}
