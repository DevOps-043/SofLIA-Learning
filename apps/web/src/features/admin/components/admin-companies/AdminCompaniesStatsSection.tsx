'use client'

import { BadgeCheck, BarChart3, Clock3, PauseCircle, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminCompaniesStatCard } from './AdminCompaniesStatCard'
import type { CompanyStats } from '../../types/admin-companies.types'

export function AdminCompaniesStatsSection({ stats }: { stats: CompanyStats | null }) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <AdminCompaniesStatCard title={t('companies.stats.active.title')} value={stats?.activeCompanies ?? 0} subtitle={t('companies.stats.active.subtitle', { total: stats?.totalCompanies ?? 0 })} icon={BadgeCheck} color={theme.successColor} delay={0} />
      <AdminCompaniesStatCard title={t('companies.stats.pending.title')} value={stats?.pendingCompanies ?? 0} subtitle={t('companies.stats.pending.subtitle')} icon={Clock3} color={theme.warningColor} delay={1} />
      <AdminCompaniesStatCard title={t('companies.stats.trial.title')} value={stats?.trialCompanies ?? 0} subtitle={t('companies.stats.trial.subtitle')} icon={Zap} color={theme.secondaryColor} delay={2} />
      <AdminCompaniesStatCard title={t('companies.stats.paused.title')} value={stats?.pausedCompanies ?? 0} subtitle={t('companies.stats.paused.subtitle')} icon={PauseCircle} color={theme.dangerColor} delay={3} />
      <AdminCompaniesStatCard title={t('companies.stats.avgUsage.title')} value={`${stats?.averageUtilization ?? 0}%`} subtitle={t('companies.stats.avgUsage.subtitle', { used: stats?.usedSeats ?? 0, total: stats?.totalSeats ?? 0 })} icon={BarChart3} color={theme.primaryColor} delay={4} />
    </section>
  )
}
