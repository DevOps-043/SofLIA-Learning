import { Building2, Layers, Map, UserCheck, Users, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { HierarchyStats } from '../../../types/hierarchy.types'
import { HierarchyPrimaryActions } from './HierarchyPrimaryActions'
import { HierarchyUnassignedWarning } from './HierarchyUnassignedWarning'
import { StatCard } from './StatCard'

export function HierarchyOverviewCard({
  canEnableHierarchy,
  hasStructure,
  hasUnassignedUsers,
  isHierarchyEnabled,
  isLoading,
  onCreateStructure,
  onRequestDisable,
  onRequestEnable,
  stats,
}: {
  canEnableHierarchy: boolean
  hasStructure: boolean
  hasUnassignedUsers: boolean
  isHierarchyEnabled: boolean
  isLoading: boolean
  onCreateStructure: () => void
  onRequestDisable: () => void
  onRequestEnable: () => void
  stats: HierarchyStats | null
}) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/5 dark:bg-carbon-800">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-bl-full bg-gradient-to-bl from-blue-500/5 to-transparent dark:from-blue-500/10" />
      <div className="relative">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.actionColor}, ${theme.secondaryColor})` }}>
              <Building2 className="h-6 w-6" style={{ color: theme.onActionColor }} />
            </div>
            <div>
              <h2 className="text-xl font-black leading-none tracking-tight" style={{ color: theme.actionColor }}>
                {t('hierarchy.title')}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-white/40">
                {t('hierarchy.subtitle')}
              </p>
            </div>
          </div>
          <HierarchyStatusBadge isHierarchyEnabled={isHierarchyEnabled} />
        </div>
        {stats ? <HierarchyStatsGrid stats={stats} /> : null}
        <HierarchyPrimaryActions
          canEnableHierarchy={canEnableHierarchy}
          hasStructure={hasStructure}
          isHierarchyEnabled={isHierarchyEnabled}
          isLoading={isLoading}
          onCreateStructure={onCreateStructure}
          onRequestDisable={onRequestDisable}
          onRequestEnable={onRequestEnable}
        />
        <HierarchyUnassignedWarning
          hasStructure={hasStructure}
          hasUnassignedUsers={hasUnassignedUsers}
          isHierarchyEnabled={isHierarchyEnabled}
          unassignedCount={stats?.users_unassigned}
        />
      </div>
    </div>
  )
}

function HierarchyStatusBadge({ isHierarchyEnabled }: { isHierarchyEnabled: boolean }) {
  const { t } = useTranslation('business')
  const activeClasses = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  const inactiveClasses = 'border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40'

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${isHierarchyEnabled ? activeClasses : inactiveClasses}`}>
      {isHierarchyEnabled ? t('hierarchy.statusActiveBadge') : t('hierarchy.statusInactiveBadge')}
    </span>
  )
}

function HierarchyStatsGrid({ stats }: { stats: HierarchyStats }) {
  const { t } = useTranslation('business')
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
      <StatCard icon={Map} label={t('hierarchy.statRegions')} value={stats.regions_count} color="blue" />
      <StatCard icon={Layers} label={t('hierarchy.statZones')} value={stats.zones_count} color="purple" />
      <StatCard icon={Users} label={t('hierarchy.statTeams')} value={stats.teams_count} color="cyan" />
      <StatCard icon={UserCheck} label={t('hierarchy.statAssigned')} value={stats.users_assigned} color="emerald" />
      <StatCard icon={UserX} label={t('hierarchy.statUnassigned')} value={stats.users_unassigned} color={stats.users_unassigned > 0 ? 'amber' : 'neutral'} />
    </div>
  )
}
