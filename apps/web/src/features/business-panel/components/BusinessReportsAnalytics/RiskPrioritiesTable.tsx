import { AlertTriangle, Clock, Minus } from 'lucide-react'
import type {
  ReportsAnalyticsPriorityUser,
  ReportsAnalyticsPriorityUserRiskLevel,
} from '../../types/reports-analytics.types'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

const RISK_STYLES: Record<ReportsAnalyticsPriorityUserRiskLevel, { bg: string; text: string; border: string; label: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', label: 'risk.high' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', label: 'risk.medium' },
  low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', label: 'risk.low' },
}

function RiskBadge({ level, t }: { level: ReportsAnalyticsPriorityUserRiskLevel; t: ReportsAnalyticsT }) {
  const s = RISK_STYLES[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      <AlertTriangle className="h-3 w-3" />
      {t('reportsAnalytics.' + s.label)}
    </span>
  )
}

function LastActivity({ date, theme }: { date: string | null; theme: ThemeTokens }) {
  if (!date) {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: theme.mutedTextColor }}>
        <Minus className="h-3 w-3" /> —
      </span>
    )
  }
  const d = new Date(date)
  const now = Date.now()
  const diffDays = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24))
  const label = diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`

  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: diffDays > 14 ? '#ef4444' : theme.subtextColor }}>
      <Clock className="h-3 w-3" />
      {label}
    </span>
  )
}

function ProgressBar({ value, theme }: { value: number; theme: ThemeTokens }) {
  const color = value === 0 ? '#ef4444' : value < 25 ? '#f59e0b' : value < 70 ? theme.accentColor : theme.successColor
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color: theme.subtextColor }}>{value}%</span>
    </div>
  )
}

interface RiskPrioritiesTableProps {
  priorityUsers: ReportsAnalyticsPriorityUser[]
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function RiskPrioritiesTable({ priorityUsers, theme, t }: RiskPrioritiesTableProps) {
  const col = 'text-left text-xs font-medium uppercase tracking-wide py-2 px-3'

  if (priorityUsers.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border py-10 text-center"
        style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
      >
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: theme.hoverBg }}>
          <AlertTriangle className="h-5 w-5" style={{ color: theme.successColor }} />
        </div>
        <p className="text-sm font-medium" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.emptyStates.noRiskUsers')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.borderColor}`, backgroundColor: theme.hoverBg }}>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.name')}</th>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.hierarchy.team')}</th>
              <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.assigned')}</th>
              <th className={`${col} text-center`} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.overview.overdueAssignments')}</th>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.overview.averageProgress')}</th>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.lastActivity')}</th>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.risk')}</th>
              <th className={col} style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.table.cause')}</th>
            </tr>
          </thead>
          <tbody>
            {priorityUsers.map((user, i) => (
              <tr
                key={user.userId}
                style={{
                  borderBottom: i < priorityUsers.length - 1 ? `1px solid ${theme.dividerColor}` : undefined,
                }}
              >
                <td className="px-3 py-3">
                  <div>
                    <p className="text-sm font-medium leading-4" style={{ color: theme.textColor }}>{user.displayName}</p>
                    <p className="mt-0.5 text-xs" style={{ color: theme.mutedTextColor }}>{user.jobTitle || '—'}</p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs" style={{ color: theme.subtextColor }}>{user.teamName || user.regionName || '—'}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs font-medium" style={{ color: theme.textColor }}>{user.coursesAssigned}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: user.overdueAssignments > 0 ? '#ef4444' : theme.subtextColor }}
                  >
                    {user.overdueAssignments}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <ProgressBar value={Math.round(user.averageProgress)} theme={theme} />
                </td>
                <td className="px-3 py-3">
                  <LastActivity date={user.lastActivityAt} theme={theme} />
                </td>
                <td className="px-3 py-3">
                  <RiskBadge level={user.riskLevel} t={t} />
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs" style={{ color: theme.subtextColor }}>
                    {t('reportsAnalytics.riskCause.' + user.riskCause)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
