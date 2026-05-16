import type { CompanyData, CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'

export type { CompanyData, CompanyMember }

export interface CourseProgress {
  id: string
  title: string
  enrolledCount: number
  completedCount: number
  averageProgress: number
}

export interface StatsData {
  overview: {
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
  activityMonthly: Array<Record<string, unknown>>
  courseProgress: CourseProgress[]
  teamDistribution: Array<Record<string, unknown>>
}
