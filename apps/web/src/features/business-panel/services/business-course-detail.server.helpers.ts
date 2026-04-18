import type {
  BusinessCourseLesson,
  BusinessCourseModule,
  BusinessCourseReview
} from '../types/business-course-detail.types'
export {
  extractGeneratedCourseInstructorHint,
  type GeneratedCourseInstructorHint
} from '../../../lib/generated-course-instructor'

export interface CourseModuleRow {
  module_id: string
  module_title: string
  module_description: string | null
  module_order_index: number
  module_duration_minutes: number | null
  is_required: boolean
}

export interface CourseLessonRow {
  lesson_id: string
  module_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  duration_seconds: number | null
  total_duration_minutes: number | null
  video_provider: string | null
  video_provider_id: string | null
  instructor_id: string | null
}

export interface CourseSupplementRow {
  lesson_id: string
  estimated_time_minutes: number | null
}

export interface CourseReviewRow {
  review_id: string
  review_title: string | null
  review_content: string | null
  rating: number | null
  is_verified: boolean | null
  created_at: string
  users: {
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    profile_picture_url?: string | null
  } | null
}

function groupSupplementsByLesson(supplements: CourseSupplementRow[]) {
  return supplements.reduce<Map<string, number>>((grouped, supplement) => {
    const previousValue = grouped.get(supplement.lesson_id) || 0
    grouped.set(supplement.lesson_id, previousValue + (supplement.estimated_time_minutes || 0))
    return grouped
  }, new Map())
}

function mapLessonsByModule(lessons: CourseLessonRow[]) {
  return lessons.reduce<Map<string, BusinessCourseLesson[]>>((grouped, lesson) => {
    const previousLessons = grouped.get(lesson.module_id) || []
    previousLessons.push({
      lesson_id: lesson.lesson_id,
      lesson_title: lesson.lesson_title,
      lesson_description: lesson.lesson_description,
      lesson_order_index: lesson.lesson_order_index,
      duration_seconds: lesson.duration_seconds || 0,
      total_duration_minutes: lesson.total_duration_minutes,
      video_provider: lesson.video_provider || '',
      video_provider_id: lesson.video_provider_id || '',
      instructor_id: lesson.instructor_id
    })
    previousLessons.sort((left, right) => left.lesson_order_index - right.lesson_order_index)
    grouped.set(lesson.module_id, previousLessons)
    return grouped
  }, new Map())
}

export function buildBusinessCourseModules(
  modules: CourseModuleRow[],
  lessons: CourseLessonRow[],
  materials: CourseSupplementRow[],
  activities: CourseSupplementRow[]
): BusinessCourseModule[] {
  const lessonsByModule = mapLessonsByModule(lessons)
  const materialMinutesByLesson = groupSupplementsByLesson(materials)
  const activityMinutesByLesson = groupSupplementsByLesson(activities)

  return modules.map(module => {
    const moduleLessons = lessonsByModule.get(module.module_id) || []
    const lessonIds = moduleLessons.map(lesson => lesson.lesson_id)

    let totalModuleDuration = 0
    let hasLessonTotalDuration = false

    for (const lesson of moduleLessons) {
      if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
        totalModuleDuration += lesson.total_duration_minutes
        hasLessonTotalDuration = true
      } else if (lesson.duration_seconds > 0) {
        totalModuleDuration += Math.ceil(lesson.duration_seconds / 60)
      }
    }

    if (!hasLessonTotalDuration && lessonIds.length > 0) {
      for (const lessonId of lessonIds) {
        totalModuleDuration += materialMinutesByLesson.get(lessonId) || 0
        totalModuleDuration += activityMinutesByLesson.get(lessonId) || 0
      }
    }

    return {
      ...module,
      module_duration_minutes: module.module_duration_minutes,
      calculated_duration_minutes: totalModuleDuration,
      lessons: moduleLessons
    }
  })
}

export function resolveBusinessCourseInstructorId(
  courseInstructorId: string | null,
  modules: BusinessCourseModule[]
) {
  if (courseInstructorId) {
    return courseInstructorId
  }

  for (const module of modules) {
    const firstLessonInstructorId = module.lessons.find(lesson => lesson.instructor_id)?.instructor_id
    if (firstLessonInstructorId) {
      return firstLessonInstructorId
    }
  }

  return null
}

export function mapBusinessCourseReviews(reviews: CourseReviewRow[]): BusinessCourseReview[] {
  return reviews.map(review => ({
    id: review.review_id,
    title: review.review_title,
    content: review.review_content || '',
    rating: review.rating || 0,
    is_verified: Boolean(review.is_verified),
    created_at: review.created_at,
    user: {
      name:
        review.users?.display_name ||
        `${review.users?.first_name || ''} ${review.users?.last_name || ''}`.trim() ||
        review.users?.username ||
        'Usuario',
      profile_picture_url: review.users?.profile_picture_url || null
    }
  }))
}
