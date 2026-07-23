export interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
}

export interface ContentDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export interface RecentActivity {
  id: string
  type: 'user_registered' | 'course_created'
  description: string
  timestamp: string
  timeAgo: string
  color: string
}
