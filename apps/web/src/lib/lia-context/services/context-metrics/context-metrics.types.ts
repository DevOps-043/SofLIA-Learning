export interface ContextUsageMetric {
  timestamp: Date
  contextType: string
  pageType?: string
  currentPage?: string
  providersUsed: string[]
  totalTokens: number
  buildTimeMs: number
  isBugReport: boolean
  userId?: string
  cached: boolean
  fragmentCount: number
}

export interface ContextStats {
  totalRequests: number
  averageTokens: number
  averageBuildTime: number
  cacheHitRate: number
  providerUsageCount: Record<string, number>
  contextTypeCount: Record<string, number>
  pageTypeCount: Record<string, number>
  bugReportCount: number
  lastUpdated: Date
}
