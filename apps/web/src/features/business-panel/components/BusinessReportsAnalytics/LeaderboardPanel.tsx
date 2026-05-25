import { Trophy } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { HierarchyRankCard } from './HierarchyRankCard'
import type { ReportsAnalyticsT, ThemeTokens } from './types'
import { UserRankCard } from './UserRankCard'

export function LeaderboardPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  const hierarchyRows = [
    ...data.rankings.regions.slice(0, 5),
    ...data.rankings.zones.slice(0, 5),
    ...data.rankings.teams.slice(0, 5),
  ].sort((a, b) => b.rankScore - a.rankScore).slice(0, 6)
  const userRows = data.rankings.users.slice(0, 6)

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-center gap-3 border-b p-4" style={{ borderColor: theme.borderColor }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.hierarchyLeaderboard')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.hierarchyLeaderboardSubtitle')}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {hierarchyRows.map((row, index) => <HierarchyRankCard key={`${row.type}-${row.id}`} row={row} rank={index + 1} theme={theme} t={t} />)}
        </div>
      </section>
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.userLeaderboard')}</h2>
          <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.userLeaderboardSubtitle')}</p>
        </div>
        <div className="mt-4 space-y-3">
          {userRows.map((row, index) => <UserRankCard key={row.userId} row={row} rank={index + 1} theme={theme} t={t} />)}
        </div>
      </section>
    </section>
  )
}
