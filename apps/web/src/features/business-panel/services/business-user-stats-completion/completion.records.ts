import type {
  BusinessUserStatsCourseRelationRecord,
  BusinessUserStatsEnrollmentCourseRecord,
  BusinessUserStatsLessonActivityRecord,
  BusinessUserStatsCourseModuleRelationRecord,
  BusinessUserStatsCourseLessonNestedRecord,
  Relation,
} from './completion.relations'

export interface BusinessUserStatsEnrollmentRecord {
  enrollment_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  course_id: string
  courses: Relation<BusinessUserStatsCourseRelationRecord>
}

export interface BusinessUserStatsLessonProgressRecord {
  progress_id: string
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  enrollment_id: string | null
  lesson_id: string
  quiz_progress_percentage: number | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
  video_progress_percentage: number | null
  required_activities_completed: number | null
  required_activities_total: number | null
  user_course_enrollments: Relation<BusinessUserStatsEnrollmentCourseRecord>
}

export interface BusinessUserStatsActivityCompletionRecord {
  completion_id: string
  activity_id: string
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  completed_at: string | null
  lesson_activities: Relation<BusinessUserStatsLessonActivityRecord>
}

export interface BusinessUserStatsLessonNoteRecord {
  note_id: string
  lesson_id: string | null
  is_auto_generated: boolean | null
  course_lessons: Relation<BusinessUserStatsCourseLessonNestedRecord>
}

export interface BusinessUserStatsCertificateRecord {
  certificate_id: string
  certificate_url: string | null
  certificate_hash: string | null
  course_id: string
  issued_at: string | null
  expires_at: string | null
  courses: Relation<BusinessUserStatsCourseRelationRecord>
}

export interface BusinessUserStatsLessonRecord {
  lesson_id: string
  lesson_title: string | null
  lesson_order_index: number | null
  module_id: string | null
  course_modules: Relation<BusinessUserStatsCourseModuleRelationRecord>
}

export interface BusinessUserStatsCourseModuleRecord {
  module_id: string
  module_title: string | null
  module_order_index: number | null
  course_id: string
}

export interface BusinessUserStatsLessonCountRecord {
  lesson_id: string
  module_id: string
}

export interface BusinessUserStatsLessonActivityCatalogRecord {
  activity_id: string
  lesson_id: string | null
}

export interface BusinessUserStatsInstructorRecord {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
}

export interface BusinessUserStatsAssignmentRecord {
  id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
  courses: Relation<Pick<BusinessUserStatsCourseRelationRecord, 'id' | 'title'>>
}
