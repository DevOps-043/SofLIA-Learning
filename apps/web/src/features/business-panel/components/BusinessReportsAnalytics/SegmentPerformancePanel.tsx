'use client'

import { useState } from 'react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

type Tab = 'teams' | 'jobTitles' | 'regions' | 'zones'

interface SegmentRow {
  name: string
  users: number
  averageProgress: number
  completionRate: number
  overdueAssignments?: number
}

function getSegmentRows(data: ReportsAnalyticsResponse, tab: Tab): SegmentRow[] {
  switch (tab) {
    case 'teams':
      return data.rankings.teams
        .map((r) => ({ name: r.name, users: r.users, averageProgress: Math.round(r.averageProgress), completionRate: Math.round(r.completionRate * 100), overdueAssignments: r.overdueAssignments }))
        .sort((a, b) => a.completionRate - b.completionRate)
    case 'regions':
      return data.rankings.regions
        .map((r) => ({ name: r.name, users: r.users, averageProgress: Math.round(r.averageProgress), completionRate: Math.round(r.completionRate * 100), overdueAssignments: r.overdueAssignments }))
        .sort((a, b) => a.completionRate - b.completionRate)
    case 'zones':
      return data.rankings.zones
        .map((r) => ({ name: r.name, users: r.users, averageProgress: Math.round(r.averageProgress), completionRate: Math.round(r.completionRate * 100), overdueAssignments: r.overdueAssignments }))
        .sort((a, b) => a.completionRate - b.completionRate)
    case 'jobTitles':
      return data.segments.jobTitles
        .filter((r) => r.key !== 'unspecified')
        .map((r) => ({ name: r.label, users: r.users, averageProgress: Math.round(r.averageProgress), completionRate: Math.round(r.completionRate * 100) }))
        .sort((a, b) => a.completionRate - b.completionRate)
  }
}

function SegmentBar({ value, maxValue, color, theme }: { value: number; maxValue: number; color: string; theme: ThemeTokens }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums" style={{ color: theme.subtextColor }}>
        {value}%
      </span>
    </div>
  )
}

interface SegmentPerformancePanelProps {
  data: Pick<ReportsAnalyticsResponse, 'rankings' | 'segments'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

const TABS: Tab[] = ['teams', 'jobTitles', 'regions', 'zones']

export function SegmentPerformancePanel({ data, theme, t }: SegmentPerformancePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('teams')

  const rows = getSegmentRows(data as ReportsAnalyticsResponse, activeTab)
  const maxCompletion = Math.max(100, ...rows.map((r) => r.completionRate))
  const maxProgress = Math.max(100, ...rows.map((r) => r.averageProgress))

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.segmentPerformance')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.segmentPerformanceSubtitle')}
        </p>
      </div>

      <div className="flex gap-1 border-b px-4 pt-3" style={{ borderColor: theme.borderColor }}>
        {TABS.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
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

      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm" style={{ color: theme.mutedTextColor }}>
            {t('reportsAnalytics.emptyStates.noSegmentData')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead style={{ backgroundColor: theme.hoverBg }}>
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                  {t('reportsAnalytics.tabs.' + activeTab)}
                </th>
                <th className="w-8 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                  {t('reportsAnalytics.table.users')}
                </th>
                <th className="w-40 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                  {t('reportsAnalytics.overview.averageProgress')}
                </th>
                <th className="w-40 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                  {t('reportsAnalytics.table.completion')}
                </th>
                {activeTab !== 'jobTitles' && (
                  <th className="w-16 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
                    {t('reportsAnalytics.overview.overdueAssignments')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, i) => (
                <tr key={row.name + i} style={{ borderTop: `1px solid ${theme.dividerColor}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: theme.textColor }}>
                    {row.name}
                  </td>
                  <td className="px-3 py-3 text-center text-xs tabular-nums" style={{ color: theme.subtextColor }}>
                    {row.users}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <SegmentBar value={row.averageProgress} maxValue={maxProgress} color={theme.accentColor} theme={theme} />
                  </td>
                  <td className="px-4 py-3 w-40">
                    <SegmentBar
                      value={row.completionRate}
                      maxValue={maxCompletion}
                      color={row.completionRate >= 70 ? theme.successColor : row.completionRate >= 40 ? '#f59e0b' : '#ef4444'}
                      theme={theme}
                    />
                  </td>
                  {activeTab !== 'jobTitles' && (
                    <td className="px-3 py-3 text-center text-xs tabular-nums font-semibold" style={{ color: (row.overdueAssignments ?? 0) > 0 ? '#ef4444' : theme.subtextColor }}>
                      {row.overdueAssignments ?? 0}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
