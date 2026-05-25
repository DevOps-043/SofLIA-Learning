export interface CompanyStats {
  totalCompanies: number
  activeCompanies: number
  trialCompanies: number
  pausedCompanies: number
  pendingCompanies: number
  totalSeats: number
  usedSeats: number
  averageUtilization: number
}

export interface CompanyDetailedStatsOverview {
  totalUsers: number
  activeUsers: number
  invitedUsers: number
  assignedCourses: number
  totalLearningHours: number
  totalSessions: number
  engagementRate: number
  avgSatisfaction: number
}

export interface CompanyDetailedStatsMonthlyActivity {
  month: string
  hours: number
  sessions: number
}

export interface CompanyDetailedStatsCourseProgress {
  id: string
  title: string
  averageProgress: number
  enrolledCount: number
  completedCount: number
}

export interface CompanyDetailedStatsTeamDistribution {
  name: string
  value: number
}

export interface CompanyDetailedStats {
  overview: CompanyDetailedStatsOverview
  activityMonthly: CompanyDetailedStatsMonthlyActivity[]
  courseProgress: CompanyDetailedStatsCourseProgress[]
  teamDistribution: CompanyDetailedStatsTeamDistribution[]
}
