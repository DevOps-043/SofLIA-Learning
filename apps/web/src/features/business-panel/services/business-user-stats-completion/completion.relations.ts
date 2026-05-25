export type Relation<T> = T | T[] | null

export function unwrapRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }
  return relation || null
}

export interface BusinessUserStatsCourseRelationRecord {
  id: string
  title: string | null
  slug?: string | null
  thumbnail_url?: string | null
  category?: string | null
  level?: string | null
  instructor_id?: string | null
}

export interface BusinessUserStatsEnrollmentCourseRecord {
  course_id: string
  courses: Relation<Pick<BusinessUserStatsCourseRelationRecord, 'id' | 'title'>>
}

export interface BusinessUserStatsCourseModuleNestedRecord {
  module_id: string
  course_id: string | null
}

export interface BusinessUserStatsCourseLessonNestedRecord {
  lesson_id: string
  module_id: string | null
  course_modules: Relation<BusinessUserStatsCourseModuleNestedRecord>
}

export interface BusinessUserStatsLessonActivityRecord {
  activity_id: string
  activity_title: string | null
  activity_type: string | null
  lesson_id: string | null
  course_lessons: Relation<BusinessUserStatsCourseLessonNestedRecord>
}

export interface BusinessUserStatsCourseModuleRelationRecord {
  module_id: string
  module_title: string | null
  module_order_index: number | null
  course_id: string | null
}
