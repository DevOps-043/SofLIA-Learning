export interface OrgUserRow {
  user_id: string
  role: string
  users: {
    id: string
    username: string | null
    email: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
    profile_picture_url: string | null
    last_login_at: string | null
  } | null
}

export interface AssignmentRow {
  id: string
  user_id: string
  course_id: string
  status: string
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
}

export interface EnrollmentRow {
  enrollment_id: string
  user_id: string
  course_id: string
  enrollment_status: string
  overall_progress_percentage: number | null
  enrolled_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
}

export interface LessonProgressRow {
  progress_id: string
  user_id: string
  lesson_id: string
  is_completed: boolean
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  enrollment_id: string | null
  user_course_enrollments?: { course_id: string } | null
}

export interface CertificateRow {
  certificate_id: string
  user_id: string
  course_id: string
  issued_at: string | null
}

export interface CourseInfo {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
}

export interface ProgressCollections {
  assignments: AssignmentRow[]
  enrollments: EnrollmentRow[]
  lessonProgress: LessonProgressRow[]
  certificates: CertificateRow[]
}
