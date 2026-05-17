import type { LiaAnalyticsData } from './lia-analytics.types'

export const EMPTY_LIA_ANALYTICS: LiaAnalyticsData = {
  period: { start: '', end: '', type: 'month' },
  summary: {
    totalConversations: 0,
    totalMessages: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    avgResponseTimeMs: 0,
    completedActivities: 0,
  },
  today: {
    cost: 0,
    tokens: 0,
    messages: 0,
    costChange: 0,
    activeUsers: 0,
    usersChange: 0,
  },
  efficiency: {
    avgMessagesPerConversation: 0,
    avgCostPerMessage: 0,
  },
  projections: { dailyAvg: 0, monthlyEstimate: 0 },
  costsByPeriod: [],
  contextDistribution: [],
  modelUsage: [],
}
