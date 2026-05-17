export type LiaAnalyticsPeriod = 'day' | 'week' | 'month' | 'year'
export type LiaAnalyticsProvider = 'openai' | 'gemini'
export type LiaAnalyticsChartType = 'area' | 'bar'

export interface LiaAnalyticsData {
  period: { start: string; end: string; type: string }
  summary: {
    totalConversations: number
    totalMessages: number
    totalTokens: number
    totalCostUsd: number
    avgResponseTimeMs: number
    completedActivities: number
  }
  today: {
    cost: number
    tokens: number
    messages: number
    costChange: number
    activeUsers: number
    usersChange: number
  }
  efficiency: {
    avgMessagesPerConversation: number
    avgCostPerMessage: number
  }
  projections: { dailyAvg: number; monthlyEstimate: number }
  costsByPeriod: Array<{ date: string; cost: number; tokens: number; messages: number }>
  contextDistribution: Array<{ contextType: string; count: number; cost: number; tokens: number; percentage: number }>
  modelUsage: Array<{ model: string; tokens: number; cost: number; count: number; percentage: number }>
}
