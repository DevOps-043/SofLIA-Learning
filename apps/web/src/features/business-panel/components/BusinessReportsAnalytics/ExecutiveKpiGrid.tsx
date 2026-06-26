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
import { deriveExecutiveKpis, type ExecutiveKpi, type KpiStatus } from './derive-executive-kpis'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

interface KpiCardProps {
  kpi: ExecutiveKpi
  icon: LucideIcon
  label: string
  theme: ThemeTokens
}

const STATUS_COLORS: Record<KpiStatus, { text: string; dot: string }> = {
  neutral: { text: 'text-gray-500', dot: 'bg-gray-400' },
  success: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  warning: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  danger: { text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
}

const KPI_ICONS: Record<string, LucideIcon> = {
  assignedUsers: Users,
  activeUsers: TrendingUp,
  averageProgress: BookOpen,
  completionRate: CheckCircle,
  atRiskUsers: AlertTriangle,
  compliance: Shield,
}

function KpiCard({ kpi, icon: Icon, label, theme }: KpiCardProps) {
  const colors = STATUS_COLORS[kpi.status]
  const isAtRisk = kpi.id === 'atRiskUsers'

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-sm"
      style={{
        backgroundColor: isAtRisk && kpi.value > 0 ? 'rgba(239,68,68,0.06)' : theme.cardBg,
        borderColor: isAtRisk && kpi.value > 0 ? 'rgba(239,68,68,0.3)' : theme.borderColor,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
          {label}
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{
            backgroundColor: isAtRisk && kpi.value > 0 ? 'rgba(239,68,68,0.12)' : theme.hoverBg,
          }}
        >
          <Icon
            className={`h-4 w-4 ${isAtRisk && kpi.value > 0 ? 'text-red-500' : ''}`}
            style={isAtRisk && kpi.value > 0 ? undefined : { color: theme.actionColor }}
          />
        </div>
      </div>

      <div>
        <span
          className="text-2xl font-bold leading-none sm:text-3xl"
          style={{ color: isAtRisk && kpi.value > 0 ? '#ef4444' : theme.textColor }}
        >
          {kpi.formatted}
        </span>
      </div>

      {kpi.subtitle ? (
        <p className={`text-xs leading-4 ${colors.text}`} style={kpi.status === 'neutral' ? { color: theme.subtextColor } : undefined}>
          {kpi.subtitle}
        </p>
      ) : null}
    </div>
  )
}

interface ExecutiveKpiGridProps {
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'learning'>
  theme: ThemeTokens
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

export function ExecutiveKpiGrid({ data, theme, t }: ExecutiveKpiGridProps) {
  const kpis = deriveExecutiveKpis(data, t)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = KPI_ICONS[kpi.id] ?? Users
        return (
          <KpiCard
            key={kpi.id}
            kpi={kpi}
            icon={Icon}
            label={t(KPI_LABEL_KEYS[kpi.id] ?? kpi.id)}
            theme={theme}
          />
        )
      })}
    </div>
  )
}
