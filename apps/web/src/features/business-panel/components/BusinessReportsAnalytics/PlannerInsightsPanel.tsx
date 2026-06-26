'use client'

import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

function SessionStat({ label, value, color, theme }: { label: string; value: number; color: string; theme: ThemeTokens }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-3 text-center" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-1 text-xs leading-4" style={{ color: theme.mutedTextColor }}>{label}</p>
    </div>
  )
}

function TimeBar({ label, minutes, maxMinutes, color, theme }: {
  label: string
  minutes: number
  maxMinutes: number
  color: string
  theme: ThemeTokens
}) {
  const pct = maxMinutes > 0 ? Math.min(100, (minutes / maxMinutes) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs" style={{ color: theme.subtextColor }}>{label}</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-4 flex-1 overflow-hidden rounded" style={{ backgroundColor: theme.hoverBg }}>
          <div className="flex h-full items-center rounded" style={{ width: `${pct}%`, backgroundColor: color + 'CC' }}>
          </div>
        </div>
        <span className="w-16 text-right text-sm font-semibold" style={{ color: theme.textColor }}>
          {minutes.toFixed(0)} min
        </span>
      </div>
    </div>
  )
}

export function PlannerInsightsPanel({
  data,
  theme,
  t,
}: {
  data: Pick<ReportsAnalyticsResponse, 'planner'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  const { planner } = data

  if (!planner.plannedSessions) {
    return (
      <section className="rounded-lg border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.plannerInsights')}
        </h2>
        <p className="mt-6 text-center text-sm" style={{ color: theme.mutedTextColor }}>
          {t('reportsAnalytics.plannerPanel.noData')}
        </p>
      </section>
    )
  }

  const adherencePct = Math.round(planner.adherenceRate * 100)
  const adherenceColor =
    adherencePct >= 75 ? '#10b981'
    : adherencePct >= 50 ? '#f59e0b'
    : '#ef4444'

  const maxMinutes = Math.max(planner.averagePlannedMinutes, planner.averageActualMinutes, 1)
  const deltaMinutes = planner.averageActualMinutes - planner.averagePlannedMinutes
  const deltaLabel = deltaMinutes > 0 ? `+${deltaMinutes.toFixed(0)}` : deltaMinutes.toFixed(0)
  const deltaColor = deltaMinutes >= 0 ? '#10b981' : '#f59e0b'

  return (
    <section className="rounded-lg border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
        {t('reportsAnalytics.sections.plannerInsights')}
      </h2>
      <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
        {t('reportsAnalytics.sections.plannerInsightsSubtitle')}
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* Left: adherence rate hero + session counts */}
        <div>
          {/* Adherence hero */}
          <div className="mb-4 flex items-center gap-4 rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                {t('reportsAnalytics.plannerPanel.adherenceRate')}
              </p>
              <p className="mt-1 text-4xl font-bold" style={{ color: adherenceColor }}>{adherencePct}%</p>
            </div>
            {/* mini arc indicator */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke={theme.hoverBg} strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={adherenceColor}
                  strokeWidth="4"
                  strokeDasharray={`${(adherencePct / 100) * 87.96} 87.96`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Session counts */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <SessionStat label={t('reportsAnalytics.plannerPanel.plannedSessions')} value={planner.plannedSessions} color={theme.textColor} theme={theme} />
            <SessionStat label={t('reportsAnalytics.plannerPanel.completedSessions')} value={planner.completedSessions} color="#10b981" theme={theme} />
            <SessionStat label={t('reportsAnalytics.plannerPanel.missedSessions')} value={planner.missedSessions} color="#ef4444" theme={theme} />
            <SessionStat label={t('reportsAnalytics.plannerPanel.rescheduledSessions')} value={planner.rescheduledSessions} color="#f59e0b" theme={theme} />
          </div>
        </div>

        {/* Right: planned vs actual time */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
            {t('reportsAnalytics.plannerPanel.avgPlannedMinutes')} vs. {t('reportsAnalytics.plannerPanel.avgActualMinutes')}
          </p>
          <div className="space-y-4">
            <TimeBar
              label={t('reportsAnalytics.plannerPanel.planned')}
              minutes={planner.averagePlannedMinutes}
              maxMinutes={maxMinutes}
              color={theme.actionColor}
              theme={theme}
            />
            <TimeBar
              label={t('reportsAnalytics.plannerPanel.actual')}
              minutes={planner.averageActualMinutes}
              maxMinutes={maxMinutes}
              color="#10b981"
              theme={theme}
            />
          </div>
          {Math.abs(deltaMinutes) > 0.5 && (
            <p className="mt-3 text-xs" style={{ color: theme.subtextColor }}>
              <span className="font-semibold" style={{ color: deltaColor }}>{deltaLabel} min</span>
              {' '}{t('reportsAnalytics.plannerPanel.perSession')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
