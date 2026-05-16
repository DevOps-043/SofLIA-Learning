import type { CompanyData, CourseProgress, StatsData } from '../shared'

export interface StatsSectionProps {
  company: CompanyData
}

export interface StatsOverview {
  totalUsers: number
  engagementRate: number
  assignedCourses: number
  avgSatisfaction: number
  totalEnrolled: number
  totalGraduated: number
  activeInLast30Days: number
  averageCourseProgress: number
  totalSessions: number
  totalLearningHours: number
}

export type { StatsData, CourseProgress }
