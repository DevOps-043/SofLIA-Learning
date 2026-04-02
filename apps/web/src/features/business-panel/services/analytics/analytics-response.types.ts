export interface OrganizationUserProfileRecord {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
  last_login_at: string | null
}

export type OrganizationUserProfileRelation =
  | OrganizationUserProfileRecord
  | OrganizationUserProfileRecord[]
  | null

export interface OrganizationUserRecord {
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  job_title: string | null
  users: OrganizationUserProfileRelation
}

export interface CourseAssignmentRecord {
  id: string
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
}

export interface CourseEnrollmentRecord {
  enrollment_id: string
  user_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
  started_at: string | null
  enrolled_at?: string | null
}

export interface CourseCertificateRecord {
  certificate_id: string
  user_id: string
  course_id: string
  issued_at: string | null
}

export interface LessonProgressRecord {
  user_id: string
  lesson_id: string
  enrollment_id: string | null
  time_spent_minutes: number | null
  is_completed: boolean | null
  completed_at: string | null
  last_accessed_at: string | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
}

export interface DailyProgressRecord {
  user_id: string
  progress_date: string
  had_activity: boolean | null
  streak_count: number | null
  study_minutes: number | null
  sessions_completed: number | null
  sessions_missed: number | null
}

export interface StudySessionRecord {
  id: string
  user_id: string
  start_time: string | null
  actual_duration_minutes: number | null
  status: string | null
  completed_at: string | null
  session_type: string | null
}

export interface OrganizationNodeMemberRecord {
  user_id: string
}

export interface OrganizationNodeRecord {
  id: string
  name: string
  type: string | null
  properties: Record<string, unknown> | null
  organization_node_users: OrganizationNodeMemberRecord[] | null
}

export interface LiaConversationRecord {
  id: string
  user_id: string
  context_type: string | null
  created_at: string | null
}

export interface LiaMessageRecord {
  id: string
  conversation_id: string
  role: string | null
  user_id: string
}

export interface UserLessonNoteRecord {
  id: string
  user_id: string
}

export interface CourseRecord {
  id: string
  title: string | null
}

export interface BuildBusinessAnalyticsResponseInput {
  orgUsers: OrganizationUserRecord[]
  assignments: CourseAssignmentRecord[]
  enrollments: CourseEnrollmentRecord[]
  certificates: CourseCertificateRecord[]
  lessonProgress: LessonProgressRecord[]
  dailyProgress: DailyProgressRecord[]
  studySessions: StudySessionRecord[]
  nodes: OrganizationNodeRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  userNotes: UserLessonNoteRecord[]
  courses: CourseRecord[]
  thirtyDaysAgoStr: string
}
