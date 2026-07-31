import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { deriveExecutiveKpis, type ExecutiveKpi } from './derive-executive-kpis'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsT } from './types'

interface KpiCardProps {
  kpi: ExecutiveKpi
  icon: LucideIcon
  label: string
}

const KPI_ICONS: Record<string, LucideIcon> = {
  assignedUsers: Users,
  activeUsers: TrendingUp,
  averageProgress: BookOpen,
  completionRate: CheckCircle,
  atRiskUsers: AlertTriangle,
  compliance: Shield,
}

function KpiCard({ kpi, icon: Icon, label }: KpiCardProps) {
  return (
    <div className={styles.metricItem} data-status={kpi.status}>
      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>
      <div className={styles.metricCopy}>
        <p className={styles.metricLabel}>{label}</p>
        <span className={styles.metricValue}>{kpi.formatted}</span>
        {kpi.subtitle ? <p className={styles.metricSubtitle}>{kpi.subtitle}</p> : null}
      </div>
    </div>
  )
}

interface ExecutiveKpiGridProps {
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'learning'>
  t: ReportsAnalyticsT
}

const KPI_LABEL_KEYS: Record<string, string> = {
  assignedUsers: 'reportsAnalytics.overview.assignedUsers',
  activeUsers: 'reportsAnalytics.overview.activeLearners',
  averageProgress: 'reportsAnalytics.overview.averageProgress',
  completionRate: 'reportsAnalytics.overview.completionRate',
  atRiskUsers: 'reportsAnalytics.overview.atRiskUsers',
  compliance: 'reportsAnalytics.overview.complianceRate',
}

export function ExecutiveKpiGrid({ data, t }: ExecutiveKpiGridProps) {
  const kpis = deriveExecutiveKpis(data, t)

  return (
    <section className={styles.statsSurface} aria-label={t('reportsAnalytics.sections.executiveKpis')}>
      {kpis.map((kpi) => {
        const Icon = KPI_ICONS[kpi.id] ?? Users
        return (
          <KpiCard
            key={kpi.id}
            kpi={kpi}
            icon={Icon}
            label={t(KPI_LABEL_KEYS[kpi.id] ?? kpi.id)}
          />
        )
      })}
    </section>
  )
}
