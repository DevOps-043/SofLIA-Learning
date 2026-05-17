export interface UserEnrollmentRow {
  overall_progress_percentage: number | null
  enrollment_status: string
  course: {
    title: string | null
    slug: string | null
  } | null
}

export interface LessonProgressRow {
  lesson_status: string
  is_completed: boolean
  video_progress_percentage: number | null
  time_spent_minutes: number | null
  lesson: {
    lesson_id: string
    lesson_title: string | null
    lesson_description: string | null
    lesson_order_index: number | null
    duration_seconds: number | null
    summary_content: string | null
    module: {
      module_title: string | null
      module_order_index: number | null
      course: {
        title: string | null
        slug: string | null
      } | null
    } | null
  } | null
}

export interface UserOrganizationRow {
  job_title: string | null
  job_description: string | null
  organizations: {
    id: string
    name: string
    slug: string
    industry: string | null
    company_size: string | null
    company_type: string | null
    company_mission: string | null
    company_country: string | null
  } | null
}

export interface UserProfileNameRow {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  username: string | null
}

export interface AssignedCourseRow {
  course: {
    id: string
    title: string | null
    slug: string | null
    description: string | null
    level: string | null
    duration_total_minutes: number | null
  } | null
}
