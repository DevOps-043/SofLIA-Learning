export interface StudentUserSummary {
  id: string
  username: string | null
  email: string | null
  display_name: string | null
  profile_picture?: string | null
  profile_picture_url?: string | null
}

export interface StudentEnrollment {
  enrollment_id?: string | null
  overall_progress_percentage?: number | null
  progress_percentage?: number | null
  enrollment_status?: string | null
  enrolled_at?: string | null
  last_accessed_at?: string | null
  users?: StudentUserSummary | null
}

export interface LiaConversationRow {
  conversation_id: string
  created_at: string
  context_type: string | null
}

export interface LiaMessageRow {
  sender?: string | null
  role?: string | null
}

export interface LiaFeedbackRow {
  rating?: number | null
}

export interface StudySessionRow {
  course_id: string | null
  lesson_id: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  progress_made?: number | null
}

export interface LessonProgressRow {
  completed_at?: string | null
  time_spent_minutes?: number | null
}

/** Shape returned by user_module_progress joined with course_modules. */
export interface ModuleProgressRow {
  module_id: string
  course_modules: {
    module_id: string
    module_title: string | null
    module_order: number | null
  } | null
  [key: string]: unknown // remaining user_module_progress columns — TODO: explicit select
}

/** Shape returned by user_activity_progress. */
export interface ActivityProgressRow {
  activity_id: string
  completed_at: string | null
  time_spent_seconds: number | null
}

/** Shape returned by user_lesson_notes. */
export interface NoteRow {
  note_id: string
  created_at: string | null
}

/** Return shape of buildLiaMetrics() in conversation-metrics.ts */
export interface LiaMetrics {
  totalConversations: number
  conversationsThisWeek: number
  totalMessages: number
  userMessages: number
  liaMessages: number
  avgMessagesPerConversation: number | string
  positiveFeedbackRate: string
  positiveFeedbackCount: number
  conversationsByWeek: Array<{ week: string; count: number }>
  conversationTopics: Array<{ tema: string; count: number; color: string }>
}

/** Return shape of buildStudySessionMetrics() in study-session-metrics.ts */
export interface StudySessionMetrics {
  totalSessions: number
  lastSession: { startTime: string; endTime: string | null; duration: number | null; hoursAgo: number } | null
  avgSessionDuration: number
  totalStudyTime: number
  totalCourseStudyTime: number
  weeklyFrequency: string
  preferredTimeSlots: Array<{ periodo: string; porcentaje: number; color: string }>
  activeDays: Array<{ dia: string; sesiones: number }>
  weeklyProgress: Array<{ dia: string; progreso: number }>
  dailyStudyTime: Array<{ dia: string; horas: number }>
  studyStreak: number
}

export interface CourseStructureIds {
  moduleIds: string[]
  lessonIds: string[]
  activityIds: string[]
}

export interface StudentCourseProgressData {
  completedActivities: ActivityProgressRow[]
  moduleProgress: ModuleProgressRow[]
  lessonProgress: LessonProgressRow[]
  userNotes: NoteRow[]
}
