import type { AdminWorkshop } from './workshops-transform.service'

export interface CourseWorkshopRow extends AdminWorkshop {
  instructor_id: string | null
}

export interface InstructorLookupRow {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
}

export interface ModuleDurationRow {
  course_id: string
  module_duration_minutes: number | null
}

export interface EnrollmentCourseRow {
  course_id: string
}
