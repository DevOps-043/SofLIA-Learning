export type EnrollmentStatus = 'completed' | 'active' | 'paused' | 'cancelled' | string

export interface EnrolledUser {
  enrollment_id: string
  user_id: string
  display_name: string
  email?: string | null
  username?: string | null
  profile_picture?: string | null
  enrollment_status: EnrollmentStatus
  progress_percentage: number
  enrolled_at?: string | null
  last_accessed_at?: string | null
}

export interface StudentWeeklyProgressPoint {
  dia: string
  progreso: number
}

export interface StudentDailyStudyTimePoint {
  dia: string
  horas: number
}

export interface StudentPreferredTimeSlot {
  periodo: string
  porcentaje: number
  color: string
}

export interface StudentActiveDayPoint {
  dia: string
  sesiones: number
}

export interface StudentConversationWeek {
  week: string
  count: number
}

export interface StudentConversationTopic {
  tema: string
  count: number
  color: string
}

export interface CourseStudentEnrollmentDetails {
  progressPercentage: number
}

export interface CourseStudentEngagementDetails {
  activitiesCompleted: number
  avgDailyTime: number
  lessonsViewed: number
  notesCreated: number
}

export interface CourseStudentLiaDetails {
  totalConversations: number
  conversationsThisWeek: number
  totalMessages: number
  avgMessagesPerConversation: number
  positiveFeedbackRate: number
  positiveFeedbackCount: number
  conversationsByWeek: StudentConversationWeek[]
  conversationTopics: StudentConversationTopic[]
}

export interface CourseStudentLastSession {
  hoursAgo: number
}

export interface CourseStudentStudySessions {
  totalCourseStudyTime: number
  totalStudyTime: number
  studyStreak: number
  weeklyProgress: StudentWeeklyProgressPoint[]
  dailyStudyTime: StudentDailyStudyTimePoint[]
  totalSessions: number
  avgSessionDuration: number
  weeklyFrequency: number
  preferredTimeSlots: StudentPreferredTimeSlot[]
  activeDays: StudentActiveDayPoint[]
  lastSession?: CourseStudentLastSession | null
}

export interface CourseStudentDetails {
  enrollment?: CourseStudentEnrollmentDetails | null
  engagement?: CourseStudentEngagementDetails | null
  studySessions?: CourseStudentStudySessions | null
  lia?: CourseStudentLiaDetails | null
}
