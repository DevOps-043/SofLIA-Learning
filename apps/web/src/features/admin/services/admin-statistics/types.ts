export interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
  communities: number
  prompts: number
  aiApps: number
}

export interface ContentDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export interface RecentActivity {
  id: string
  type:
    | 'user_registered'
    | 'course_created'
    | 'community_created'
    | 'prompt_added'
    | 'ai_app_added'
  description: string
  timestamp: string
  timeAgo: string
  color: string
}
