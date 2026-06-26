'use client'

import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

function StatChip({ label, value, theme }: { label: string; value: string | number; theme: ThemeTokens }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: theme.textColor }}>{value}</p>
    </div>
  )
}

function QualityBar({ label, value, color, theme }: { label: string; value: number; color: string; theme: ThemeTokens }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs" style={{ color: theme.subtextColor }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: theme.textColor }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function ContextBar({ label, value, maxValue, theme }: { label: string; value: number; maxValue: number; theme: ThemeTokens }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0">
        <span className="text-xs leading-4" style={{ color: theme.subtextColor }}>{label}</span>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: theme.actionColor + 'CC' }} />
        </div>
        <span className="w-10 text-right text-xs font-semibold" style={{ color: theme.textColor }}>{value}</span>
      </div>
    </div>
  )
}

export function SofLIAQualityPanel({
  data,
  theme,
  t,
}: {
  data: Pick<ReportsAnalyticsResponse, 'soflia' | 'quality'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  const { soflia, quality } = data

  if (!soflia.totalConversations && !soflia.activeUsers) {
    return (
      <section className="rounded-lg border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.sofliaQuality')}
        </h2>
        <p className="mt-6 text-center text-sm" style={{ color: theme.mutedTextColor }}>
          {t('reportsAnalytics.sofliaPanel.noData')}
        </p>
      </section>
    )
  }

  const completionPct = Math.round(soflia.completionRate)
  const avgMessages = soflia.averageMessagesPerConversation.toFixed(1)
  const responseTimeSec = quality.averageResponseTimeSeconds > 0
    ? `${quality.averageResponseTimeSeconds.toFixed(1)}${t('reportsAnalytics.sofliaPanel.seconds')}`
    : '—'

  const sentimentValue = quality.averageSentiment
  const sentimentLabel =
    sentimentValue >= 0.3 ? t('reportsAnalytics.sofliaPanel.sentimentPositive')
    : sentimentValue <= -0.2 ? t('reportsAnalytics.sofliaPanel.sentimentNegative')
    : t('reportsAnalytics.sofliaPanel.sentimentNeutral')
  const sentimentColor =
    sentimentValue >= 0.3 ? '#10b981'
    : sentimentValue <= -0.2 ? '#ef4444'
    : '#f59e0b'

  const contextMax = Math.max(...soflia.contextBreakdown.map((c) => c.value), 1)

  return (
    <section className="rounded-lg border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
        {t('reportsAnalytics.sections.sofliaQuality')}
      </h2>
      <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
        {t('reportsAnalytics.sections.sofliaQualitySubtitle')}
      </p>

      {/* Top stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label={t('reportsAnalytics.sofliaPanel.activeUsers')} value={soflia.activeUsers} theme={theme} />
        <StatChip label={t('reportsAnalytics.sofliaPanel.totalConversations')} value={soflia.totalConversations} theme={theme} />
        <StatChip label={t('reportsAnalytics.sofliaPanel.avgMessages')} value={avgMessages} theme={theme} />
        <StatChip label={t('reportsAnalytics.sofliaPanel.completionRate')} value={`${completionPct}%`} theme={theme} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Quality metrics */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
            {t('reportsAnalytics.sections.responseQuality')}
          </p>
          <div className="space-y-3">
            <QualityBar label={t('reportsAnalytics.sofliaPanel.questionRate')} value={quality.questionRate} color={theme.actionColor} theme={theme} />
            <QualityBar label={t('reportsAnalytics.sofliaPanel.helpRate')} value={quality.helpRate} color="#f59e0b" theme={theme} />
            <QualityBar label={t('reportsAnalytics.sofliaPanel.redirectRate')} value={quality.redirectRate} color="#f97316" theme={theme} />
            <QualityBar label={t('reportsAnalytics.sofliaPanel.offTopicRate')} value={quality.offTopicRate} color="#ef4444" theme={theme} />
          </div>

          {/* Sentiment + response time row */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: theme.borderColor }}>
              <p className="text-xs" style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.sofliaPanel.avgSentiment')}</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: sentimentColor }}>{sentimentLabel}</p>
            </div>
            {quality.averageResponseTimeSeconds > 0 && (
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: theme.borderColor }}>
                <p className="text-xs" style={{ color: theme.mutedTextColor }}>{t('reportsAnalytics.sofliaPanel.avgResponseTime')}</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: theme.textColor }}>{responseTimeSec}</p>
              </div>
            )}
          </div>
        </div>

        {/* Context breakdown */}
        {soflia.contextBreakdown.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.sofliaPanel.contextBreakdown')}
            </p>
            <div className="space-y-2.5">
              {soflia.contextBreakdown
                .sort((a, b) => b.value - a.value)
                .slice(0, 8)
                .map((ctx) => (
                  <ContextBar
                    key={ctx.key}
                    label={ctx.label}
                    value={ctx.value}
                    maxValue={contextMax}
                    theme={theme}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
