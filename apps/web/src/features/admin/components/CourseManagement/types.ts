import { CourseSkill } from '../../../courses/components/CourseSkillsSelector'
import { AdminModule } from '../../services/adminModules.service'
import { AdminLesson } from '../../services/adminLessons.service'

export interface CourseManagementPageProps {
  courseId: string
}

export type ActiveTab = 'modules' | 'config' | 'certificates' | 'preview' | 'stats'

export interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export interface ConfigData {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  price: number
  thumbnail_url: string
  slug: string
  instructor_id: string
}

export interface Instructor {
  id: string
  name: string
}

export interface CourseWorkshopPreview {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  price: number
  thumbnail_url: string
  slug: string
  instructor_id: string
  instructor_name?: string | null
}

export interface CourseUserStats {
  total_enrolled: number
  completion_rate: number
  average_progress: number
  average_rating: number
  total_reviews: number
  total_lessons: number
  total_materials: number
  total_activities: number
  retention_rate: number
  active_7d: number
  active_30d: number
  total_certificates: number
  completed: number
  in_progress: number
  not_started: number
}

export interface CourseStudentStatusPoint {
  mes: string
  completados: number
  enProgreso: number
  noIniciados: number
}

export interface CourseChartData {
  student_status_by_month: CourseStudentStatusPoint[]
}

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

export const DEFAULT_CONFIG_DATA: ConfigData = {
  title: '',
  description: '',
  category: 'ia',
  level: 'beginner',
  duration_total_minutes: 60,
  price: 0,
  thumbnail_url: '',
  slug: '',
  instructor_id: ''
}

export type { AdminModule, AdminLesson, CourseSkill }
