'use client'

import { SectionWrapper } from './shared'
import { useTheme } from '@/core/hooks/useTheme'
import { StatsActivityChartCard } from './stats-section/StatsActivityChartCard'
import { StatsCoursePerformanceCard } from './stats-section/StatsCoursePerformanceCard'
import { StatsErrorState } from './stats-section/StatsErrorState'
import { StatsImpactCard } from './stats-section/StatsImpactCard'
import { StatsLoadingState } from './stats-section/StatsLoadingState'
import { StatsSummaryCards } from './stats-section/StatsSummaryCards'
import { StatsTeamDistributionCard } from './stats-section/StatsTeamDistributionCard'
import type { StatsSectionProps } from './stats-section/types'
import { useCompanyStats } from './stats-section/useCompanyStats'

function StatsSection({ company }: StatsSectionProps) {
  const { isDark } = useTheme()
  const { loading, stats } = useCompanyStats(company.id)

  if (loading) return <StatsLoadingState />
  if (!stats) return <StatsErrorState />

  return (
    <SectionWrapper>
      <StatsSummaryCards overview={stats.overview} />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatsActivityChartCard activityMonthly={stats.activityMonthly} isDark={isDark} />
        <StatsTeamDistributionCard teamDistribution={stats.teamDistribution} isDark={isDark} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatsCoursePerformanceCard courseProgress={stats.courseProgress} />
        <StatsImpactCard overview={stats.overview} />
      </div>
    </SectionWrapper>
  )
}

export { StatsSection }
