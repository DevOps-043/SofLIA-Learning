// ========== Overview Tab ==========
export interface OverviewStats {
  activeUsers30d: number
  completionRate: number
  studyHoursMonth: number
  certificatesMonth: number
  usersByOrganization: { name: string; count: number }[]
  dailyActivity: { date: string; count: number }[]
  progressDistribution: { range: string; count: number }[]
  roleDistribution: { role: string; count: number }[]
}

// ========== Learning Tab ==========
export interface LearningStats {
  avgTimePerLesson: number
  quizPassRate: number
  avgSessionsPerWeek: number
  topCoursesByTime: { course: string; minutes: number }[]
  sessionsPlannedVsCompleted: { week: string; planned: number; completed: number }[]
  timeByContentType: { type: string; minutes: number }[]
  streakDistribution: { range: string; count: number }[]
}

// ========== Engagement Tab ==========
export interface EngagementStats {
  activationRate: number
  weeklyReturn: number
  avgSatisfaction: number
  inactiveUsers30d: number
  newVsRecurring: { week: string; new: number; recurring: number }[]
  ratingDistribution: { rating: number; count: number }[]
  engagementByOrg: { org: string; ratio: number; active: number; total: number }[]
  usersByCountry: { country: string; count: number }[]
}

// ========== User Detail Tab ==========
export interface UserDetail {
  id: string
  username: string
  email: string
  displayName: string | null
  profilePictureUrl: string | null
  dateOfBirth: string | null
  gender: string | null
  age: number | null
  organization: string | null
  orgRole: string | null
  coursesEnrolled: number
  avgProgress: number
  studyHours: number
  lastLogin: string | null
  certificates: number
}

export interface UserDetailResponse {
  users: UserDetail[]
  total: number
  page: number
  limit: number
}

// ========== User Progress Modal ==========
export interface UserLessonDetail {
  lessonId: string
  lessonTitle: string
  orderIndex: number
  status: 'not_started' | 'in_progress' | 'completed' | 'locked'
  videoProgress: number
  timeSpentMinutes: number
  quizCompleted: boolean
  quizPassed: boolean
}

export interface UserCourseProgress {
  enrollmentId: string
  courseId: string
  courseTitle: string
  courseLevel: string
  thumbnailUrl: string | null
  enrollmentStatus: string
  overallProgress: number
  enrolledAt: string
  completedAt: string | null
  totalStudyMinutes: number
  hasCertificate: boolean
  certificateIssuedAt: string | null
  lessons: UserLessonDetail[]
}

export interface UserProgressResponse {
  courses: UserCourseProgress[]
}

// ========== Tab Types ==========
export type UserStatsTab = 'overview' | 'learning' | 'engagement' | 'users'
