'use client'

import { useState } from 'react'
import type {
  ReportsAnalyticsHierarchyRankingRow,
  ReportsAnalyticsResponse,
  ReportsAnalyticsUserRankingRow,
} from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

type RankingTab = 'users' | 'teams' | 'regions' | 'zones'

const TABS: RankingTab[] = ['users', 'teams', 'regions', 'zones']
const MEDAL_COLORS = ['#FFD700', '#A8B5C8', '#CD7F32'] as const

function RankBadge({ rank }: { rank: number }) {
  const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
      style={
        medalColor
          ? { backgroundColor: `${medalColor}28`, color: medalColor, border: `1.5px solid ${medalColor}` }
          : { color: '#9CA3AF', border: '1.5px solid #E5E7EB' }
      }
    >
      {rank}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score)
  const bg = rounded >= 70 ? '#10b98120' : rounded >= 50 ? '#f59e0b20' : '#ef444420'
  const color = rounded >= 70 ? '#10b981' : rounded >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <span className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums" style={{ backgroundColor: bg, color }}>
      {rounded}%
    </span>
  )
}

function MiniBar({ value, theme }: { value: number; theme: ThemeTokens }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex min-w-[90px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-7 shrink-0 text-right text-xs tabular-nums" style={{ color: theme.subtextColor }}>
        {pct}%
      </span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  theme,
}: {
  active: boolean
  onClick: () => void
  label: string
  theme: ThemeTokens
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? theme.hoverBg : 'transparent',
        color: active ? theme.textColor : theme.mutedTextColor,
        borderBottom: active ? `2px solid ${theme.actionColor}` : '2px solid transparent',
      }}
    >
      {label}
    </button>
  )
}

function UsersTable({
  rows,
  theme,
  t,
}: {
  rows: ReportsAnalyticsUserRankingRow[]
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: theme.mutedTextColor }}>
          {t('reportsAnalytics.emptyStates.noRankingData')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead style={{ backgroundColor: theme.hoverBg }}>
          <tr>
            <th className="w-8 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.rank')}
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.user')}
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.team')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.progress')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.completion')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.evaluations')}
            </th>
            <th className="w-20 px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.userId} style={{ borderTop: `1px solid ${theme.dividerColor}` }}>
              <td className="px-3 py-3 text-center">
                <div className="flex justify-center">
                  <RankBadge rank={i + 1} />
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium" style={{ color: theme.textColor }}>{row.displayName}</p>
                {row.jobTitle && (
                  <p className="mt-0.5 text-xs" style={{ color: theme.mutedTextColor }}>{row.jobTitle}</p>
                )}
              </td>
              <td className="px-3 py-3">
                <p className="text-xs" style={{ color: theme.subtextColor }}>
                  {row.teamName && row.teamName !== 'unspecified' ? row.teamName : '—'}
                </p>
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.averageProgress} theme={theme} />
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.completionRate} theme={theme} />
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.quizAverageScore} theme={theme} />
              </td>
              <td className="px-3 py-3 text-right">
                <ScoreBadge score={row.rankScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HierarchyTable({
  rows,
  label,
  theme,
  t,
}: {
  rows: ReportsAnalyticsHierarchyRankingRow[]
  label: string
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: theme.mutedTextColor }}>
          {t('reportsAnalytics.emptyStates.noRankingData')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[580px] border-collapse text-sm">
        <thead style={{ backgroundColor: theme.hoverBg }}>
          <tr>
            <th className="w-8 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.rank')}
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {label}
            </th>
            <th className="w-16 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.users')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.progress')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.completion')}
            </th>
            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.quality')}
            </th>
            <th className="w-16 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.overdue')}
            </th>
            <th className="w-20 px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
              {t('reportsAnalytics.table.score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} style={{ borderTop: `1px solid ${theme.dividerColor}` }}>
              <td className="px-3 py-3 text-center">
                <div className="flex justify-center">
                  <RankBadge rank={i + 1} />
                </div>
              </td>
              <td className="px-4 py-3 font-medium" style={{ color: theme.textColor }}>
                {row.name}
              </td>
              <td className="px-3 py-3 text-center text-xs tabular-nums" style={{ color: theme.subtextColor }}>
                {row.users}
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.averageProgress} theme={theme} />
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.completionRate} theme={theme} />
              </td>
              <td className="px-4 py-3">
                <MiniBar value={row.qualityScore} theme={theme} />
              </td>
              <td className="px-3 py-3 text-center text-xs font-semibold tabular-nums" style={{ color: row.overdueAssignments > 0 ? '#ef4444' : theme.subtextColor }}>
                {row.overdueAssignments}
              </td>
              <td className="px-3 py-3 text-right">
                <ScoreBadge score={row.rankScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RankingTablesPanelProps {
  data: Pick<ReportsAnalyticsResponse, 'rankings'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function RankingTablesPanel({ data, theme, t }: RankingTablesPanelProps) {
  const [activeTab, setActiveTab] = useState<RankingTab>('users')

  const hasAnyHierarchy =
    data.rankings.teams.length > 0 ||
    data.rankings.regions.length > 0 ||
    data.rankings.zones.length > 0

  const visibleTabs = TABS.filter((tab) => {
    if (tab === 'users') return data.rankings.users.length > 0
    if (tab === 'teams') return data.rankings.teams.length > 0
    if (tab === 'regions') return data.rankings.regions.length > 0
    if (tab === 'zones') return data.rankings.zones.length > 0
    return false
  })

  if (data.rankings.users.length === 0 && !hasAnyHierarchy) {
    return null
  }

  const safeActiveTab: RankingTab =
    visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0] ?? 'users'

  return (
    <section className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.rankings')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.rankingsSubtitle')}
        </p>
      </div>

      <div className="flex gap-1 border-b px-4 pt-3" style={{ borderColor: theme.borderColor }}>
        {visibleTabs.map((tab) => (
          <TabButton
            key={tab}
            active={tab === safeActiveTab}
            onClick={() => setActiveTab(tab)}
            label={t('reportsAnalytics.tabs.' + tab)}
            theme={theme}
          />
        ))}
      </div>

      {safeActiveTab === 'users' && (
        <UsersTable rows={data.rankings.users} theme={theme} t={t} />
      )}
      {safeActiveTab === 'teams' && (
        <HierarchyTable rows={data.rankings.teams} label={t('reportsAnalytics.tabs.teams')} theme={theme} t={t} />
      )}
      {safeActiveTab === 'regions' && (
        <HierarchyTable rows={data.rankings.regions} label={t('reportsAnalytics.tabs.regions')} theme={theme} t={t} />
      )}
      {safeActiveTab === 'zones' && (
        <HierarchyTable rows={data.rankings.zones} label={t('reportsAnalytics.tabs.zones')} theme={theme} t={t} />
      )}
    </section>
  )
}
