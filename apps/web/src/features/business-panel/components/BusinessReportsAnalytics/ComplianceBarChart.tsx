'use client'

import { useState } from 'react'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportsAnalyticsHierarchyRankingRow, ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const COMPLIANCE_TARGET = 80

type ComplianceTab = 'teams' | 'regions' | 'zones'

function getBarColor(rate: number): string {
  if (rate >= COMPLIANCE_TARGET) return '#10b981'
  if (rate >= 50) return '#f59e0b'
  return '#ef4444'
}

interface BarRow {
  name: string
  fullName: string
  completionRate: number
  users: number
  overdue: number
  color: string
  atTarget: boolean
}

function buildRows(rows: ReportsAnalyticsHierarchyRankingRow[]): BarRow[] {
  return [...rows]
    .filter((r) => r.users > 0)
    .sort((a, b) => a.completionRate - b.completionRate)
    .map((r) => {
      const rate = Math.round(r.completionRate)
      return {
        name: r.name.length > 22 ? `${r.name.slice(0, 20)}…` : r.name,
        fullName: r.name,
        completionRate: rate,
        users: r.users,
        overdue: r.overdueAssignments,
        color: getBarColor(rate),
        atTarget: rate >= COMPLIANCE_TARGET,
      }
    })
}

function ComplianceTooltip({
  active,
  payload,
  theme,
  t,
}: {
  active?: boolean
  payload?: Array<{ payload: BarRow }>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border p-3 text-sm shadow-lg" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <p className="font-semibold" style={{ color: theme.textColor }}>{row.fullName}</p>
      <div className="mt-2 space-y-1 text-xs" style={{ color: theme.subtextColor }}>
        <div className="flex justify-between gap-6">
          <span>{t('reportsAnalytics.table.completion')}</span>
          <span className="font-bold tabular-nums" style={{ color: row.color }}>{row.completionRate}%</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>{t('reportsAnalytics.table.users')}</span>
          <span className="font-semibold tabular-nums" style={{ color: theme.textColor }}>{row.users}</span>
        </div>
        {row.overdue > 0 && (
          <div className="flex justify-between gap-6">
            <span>{t('reportsAnalytics.table.overdue')}</span>
            <span className="font-bold tabular-nums" style={{ color: '#ef4444' }}>{row.overdue}</span>
          </div>
        )}
        <div className="flex justify-between gap-6">
          <span>{t('reportsAnalytics.compliance.target')} ({COMPLIANCE_TARGET}%)</span>
          <span className="font-semibold" style={{ color: row.atTarget ? '#10b981' : '#ef4444' }}>
            {row.atTarget ? '✓' : `–${COMPLIANCE_TARGET - row.completionRate}pp`}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ComplianceBarChartProps {
  data: Pick<ReportsAnalyticsResponse, 'rankings'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function ComplianceBarChart({ data, theme, t }: ComplianceBarChartProps) {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('teams')

  const visibleTabs = (['teams', 'regions', 'zones'] as ComplianceTab[]).filter((tab) => {
    if (tab === 'teams') return data.rankings.teams.length > 0
    if (tab === 'regions') return data.rankings.regions.length > 0
    if (tab === 'zones') return data.rankings.zones.length > 0
    return false
  })

  if (visibleTabs.length === 0) return null

  const safeTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0]

  const rawRows =
    safeTab === 'teams' ? data.rankings.teams
    : safeTab === 'regions' ? data.rankings.regions
    : data.rankings.zones

  const rows = buildRows(rawRows)
  if (rows.length === 0) return null

  const belowTarget = rows.filter((r) => !r.atTarget)
  const atTarget = rows.filter((r) => r.atTarget)
  const chartHeight = Math.max(200, rows.length * 46)

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.complianceByArea')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.complianceByAreaSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b px-4 pt-3" style={{ borderColor: theme.borderColor }}>
        {visibleTabs.map((tab) => {
          const isActive = tab === safeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? theme.hoverBg : 'transparent',
                color: isActive ? theme.textColor : theme.mutedTextColor,
                borderBottom: isActive ? `2px solid ${theme.actionColor}` : '2px solid transparent',
              }}
            >
              {t('reportsAnalytics.tabs.' + tab)}
            </button>
          )
        })}
      </div>

      <div className="p-4">
        {/* Summary chips */}
        <div className="mb-4 flex flex-wrap gap-3">
          {[
            { label: t('reportsAnalytics.compliance.healthy'), count: atTarget.length, color: '#10b981', bg: '#10b98118' },
            { label: t('reportsAnalytics.compliance.acceptable'), count: rows.filter((r) => !r.atTarget && r.completionRate >= 50).length, color: '#f59e0b', bg: '#f59e0b18' },
            { label: t('reportsAnalytics.compliance.atRisk'), count: rows.filter((r) => r.completionRate < 50).length, color: '#ef4444', bg: '#ef444418' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: bg }}>
              <span className="text-lg font-bold tabular-nums" style={{ color }}>{count}</span>
              <span className="text-xs font-medium" style={{ color }}>{label}</span>
            </div>
          ))}
          {belowTarget.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: theme.mutedTextColor }}>
              <span className="h-3 w-0.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              {t('reportsAnalytics.compliance.targetLabel')} {COMPLIANCE_TARGET}%
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 48, bottom: 16, left: 130 }}
              barCategoryGap="22%"
            >
              <YAxis
                dataKey="name"
                type="category"
                width={125}
                tick={{ fontSize: 12, fill: theme.subtextColor }}
                axisLine={false}
                tickLine={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: theme.mutedTextColor }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={<ComplianceTooltip theme={theme} t={t} />}
                cursor={{ fill: theme.hoverBg }}
              />
              <ReferenceLine
                x={COMPLIANCE_TARGET}
                stroke="#ef4444"
                strokeDasharray="5 3"
                strokeWidth={1.5}
              />
              <Bar dataKey="completionRate" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {rows.map((row, i) => (
                  <Cell key={i} fill={`${row.color}CC`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Target legend */}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-xs pr-1" style={{ color: '#ef4444' }}>
          <span>— —</span>
          <span>{t('reportsAnalytics.compliance.targetLabel')} {COMPLIANCE_TARGET}%</span>
        </div>
      </div>
    </section>
  )
}
