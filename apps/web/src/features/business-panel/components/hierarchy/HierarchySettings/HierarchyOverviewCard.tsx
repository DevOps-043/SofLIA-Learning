import { Building2, Layers, Map, UserCheck, Users, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HierarchyStats } from '../../../types/hierarchy.types'
import { HierarchyPrimaryActions } from './HierarchyPrimaryActions'
import { HierarchyUnassignedWarning } from './HierarchyUnassignedWarning'
import { StatCard } from './StatCard'
import styles from '../HierarchyExperience.module.css'

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

  return (
    <section className={styles.settingsCard}>
      <header className={styles.settingsHeader}>
        <div className={styles.sectionIdentity}>
          <div className={styles.sectionIcon}>
            <Building2 aria-hidden="true" />
          </div>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{t('hierarchy.title')}</h2>
            <p className={styles.sectionDescription}>{t('hierarchy.subtitle')}</p>
          </div>
        </div>
        <HierarchyStatusBadge isHierarchyEnabled={isHierarchyEnabled} />
      </header>
      {stats ? <HierarchyStatsGrid stats={stats} /> : null}
      <div className={styles.settingsBody}>
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
    </section>
  )
}

function HierarchyStatusBadge({ isHierarchyEnabled }: { isHierarchyEnabled: boolean }) {
  const { t } = useTranslation('business')
  return (
    <span className={`${styles.statusBadge} ${isHierarchyEnabled ? styles.statusActive : ''}`}>
      {isHierarchyEnabled ? t('hierarchy.statusActiveBadge') : t('hierarchy.statusInactiveBadge')}
    </span>
  )
}

function HierarchyStatsGrid({ stats }: { stats: HierarchyStats }) {
  const { t } = useTranslation('business')
  return (
    <div className={styles.metrics}>
      <StatCard icon={Map} label={t('hierarchy.statRegions')} value={stats.regions_count} color="blue" />
      <StatCard icon={Layers} label={t('hierarchy.statZones')} value={stats.zones_count} color="purple" />
      <StatCard icon={Users} label={t('hierarchy.statTeams')} value={stats.teams_count} color="cyan" />
      <StatCard icon={UserCheck} label={t('hierarchy.statAssigned')} value={stats.users_assigned} color="emerald" />
      <StatCard icon={UserX} label={t('hierarchy.statUnassigned')} value={stats.users_unassigned} color={stats.users_unassigned > 0 ? 'amber' : 'neutral'} />
    </div>
  )
}
