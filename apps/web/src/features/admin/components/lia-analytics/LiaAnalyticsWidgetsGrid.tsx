'use client'

import {
  ActivityHeatmapWidget,
  ConversationsTableWidget,
  CostOverviewWidget,
  ContextDistributionWidget,
  CourseAnalyticsWidget,
  LiaStatsCards,
  TokenUsageWidget,
  TopQuestionsWidget,
  TopUsersWidget,
} from '../LiaAnalyticsWidgets'
import { EMPTY_LIA_ANALYTICS } from './lia-analytics.defaults'
import type { LiaAnalyticsChartType, LiaAnalyticsData, LiaAnalyticsPeriod } from './lia-analytics.types'

interface LiaAnalyticsWidgetsGridProps {
  data: LiaAnalyticsData | null
  isLoading: boolean
  chartType: LiaAnalyticsChartType
  period: LiaAnalyticsPeriod
}

export function LiaAnalyticsWidgetsGrid({ data, isLoading, chartType, period }: LiaAnalyticsWidgetsGridProps) {
  const analytics = data ?? EMPTY_LIA_ANALYTICS

  return (
    <div className="space-y-6">
      <LiaStatsCards summary={analytics.summary} today={analytics.today} efficiency={analytics.efficiency} projectedMonthlyCost={analytics.projections.monthlyEstimate} isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CostOverviewWidget data={analytics.costsByPeriod} isLoading={isLoading} chartType={chartType} />
        <ContextDistributionWidget data={analytics.contextDistribution} isLoading={isLoading} />
      </div>
      <CourseAnalyticsWidget period={period} isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TokenUsageWidget modelUsage={analytics.modelUsage} totalTokens={analytics.summary.totalTokens} isLoading={isLoading} />
        <ActivityHeatmapWidget period={period} isLoading={isLoading} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopQuestionsWidget period={period} limit={8} isLoading={isLoading} />
        <TopUsersWidget period={period} limit={8} isLoading={isLoading} />
      </div>
      <ConversationsTableWidget period={period} />
    </div>
  )
}
