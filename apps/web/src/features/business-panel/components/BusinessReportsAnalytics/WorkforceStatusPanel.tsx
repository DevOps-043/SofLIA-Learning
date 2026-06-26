'use client'

import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const SEGMENTS = [
  { key: 'notStarted', bands: ['not_started'], color: '#ef4444' },
  { key: 'inProcess', bands: ['low', 'medium'], color: '#f59e0b' },
  { key: 'advancing', bands: ['high', 'almost_done'], color: '#3b82f6' },
  { key: 'completedStatus', bands: ['completed'], color: '#10b981' },
] as const

interface WorkforceSegment {
  key: string
  value: number
  color: string
  pct: number
}

function deriveSegments(data: Pick<ReportsAnalyticsResponse, 'learning'>): WorkforceSegment[] {
  const dist = data.learning.progressDistribution
  const v = (key: string) => dist.find((d) => d.key === key)?.value ?? 0

  const raw = SEGMENTS.map((s) => ({
    key: s.key,
    value: s.bands.reduce((sum, band) => sum + v(band), 0),
    color: s.color,
  }))

  const total = raw.reduce((sum, s) => sum + s.value, 0) || 1
  return raw.map((s) => ({ ...s, pct: Math.round((s.value / total) * 100) }))
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: WorkforceSegment & { name: string } }>
  theme: ThemeTokens
}
function CustomTooltip({ active, payload, theme }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border px-3 py-2 text-sm shadow-lg" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <p className="font-semibold" style={{ color: theme.textColor }}>{entry.name}</p>
      <p className="tabular-nums" style={{ color: theme.subtextColor }}>
        {entry.value.toLocaleString()} · {entry.payload.pct}%
      </p>
    </div>
  )
}

interface WorkforceStatusPanelProps {
  data: Pick<ReportsAnalyticsResponse, 'learning' | 'overview'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function WorkforceStatusPanel({ data, theme, t }: WorkforceStatusPanelProps) {
  const segments = deriveSegments(data)
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) return null

  const completedSeg = segments.find((s) => s.key === 'completedStatus')!
  const chartData = segments
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, name: t(`reportsAnalytics.workforce.${s.key}`) }))

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.workforceStatus')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.workforceStatusSubtitle')}
        </p>
      </div>

      <div className="p-4">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Donut */}
          <div className="flex items-center justify-center md:col-span-2">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={3}
                    stroke={theme.cardBg}
                    paddingAngle={2}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null
                        const cx = viewBox.cx as number
                        const cy = viewBox.cy as number
                        return (
                          <g>
                            <text
                              x={cx}
                              y={cy - 6}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ fontSize: 26, fontWeight: 700, fill: theme.textColor }}
                            >
                              {total.toLocaleString()}
                            </text>
                            <text
                              x={cx}
                              y={cy + 18}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ fontSize: 11, fill: theme.mutedTextColor }}
                            >
                              {t('reportsAnalytics.workforce.total')}
                            </text>
                          </g>
                        )
                      }}
                      position="center"
                    />
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 md:col-span-3">
            {segments.map((seg) => (
              <div key={seg.key} className="flex flex-col rounded-lg p-3" style={{ backgroundColor: theme.hoverBg }}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs leading-tight" style={{ color: theme.mutedTextColor }}>
                    {t(`reportsAnalytics.workforce.${seg.key}`)}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: theme.textColor }}>
                  {seg.value.toLocaleString()}
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.borderColor }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  />
                </div>
                <p className="mt-1 text-xs tabular-nums font-medium" style={{ color: seg.color }}>
                  {seg.pct}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary insight */}
        <div className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: theme.hoverBg }}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: '#10b981' }} />
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            <span className="font-semibold tabular-nums" style={{ color: '#10b981' }}>
              {completedSeg.value.toLocaleString()}
            </span>
            {' '}
            {t('reportsAnalytics.workforce.summaryOf')}
            {' '}
            <span className="font-semibold tabular-nums" style={{ color: theme.textColor }}>
              {total.toLocaleString()}
            </span>
            {' '}
            {t('reportsAnalytics.workforce.summaryCompleted')}
            {' '}
            <span className="font-semibold" style={{ color: '#10b981' }}>
              ({completedSeg.pct}%)
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
