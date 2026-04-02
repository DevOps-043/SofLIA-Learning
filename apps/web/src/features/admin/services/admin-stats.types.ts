export interface AdminStats {
  totalUsers: number
  activeCourses: number
  totalOrganizations?: number
  totalAIApps: number
  totalNews: number
  totalReels: number
  engagementRate: number
}

export interface AdminStatsWithChanges extends AdminStats {
  userGrowth: number
  courseGrowth: number
  organizationGrowth?: number
  aiAppGrowth: number
  newsGrowth: number
  reelsGrowth: number
  engagementGrowth: number
}
