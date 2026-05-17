import type {
  AggregatedCourseDeadlineContext,
  DeadlineCourseLessonRow,
  DeadlineCourseRow,
} from './types'

function getCategoryLabel(category: DeadlineCourseRow['category']): string {
  if (Array.isArray(category)) {
    return category.map((item) => item.name).join(', ')
  }

  return category?.name || 'General'
}

function getLessonMinutes(lesson: DeadlineCourseLessonRow) {
  const estimates = lesson.lesson_time_estimates
  const estimate = Array.isArray(estimates) ? estimates[0] : estimates
  const videoMinutes =
    estimate?.video_minutes ?? Math.round((lesson.duration_seconds ?? 0) / 60)
  let readingMinutes = estimate?.reading_time_minutes ?? 0
  let activityMinutes =
    (estimate?.activities_time_minutes || 0) +
    (estimate?.quiz_time_minutes || 0) +
    (estimate?.exercise_time_minutes || 0)

  if (!estimate && Array.isArray(lesson.lesson_materials)) {
    lesson.lesson_materials.forEach((material) => {
      readingMinutes += material.estimated_time_minutes || 0
    })
  }

  if (!estimate && Array.isArray(lesson.lesson_activities)) {
    lesson.lesson_activities.forEach((activity) => {
      activityMinutes += activity.estimated_time_minutes || 0
    })
  }

  return { activityMinutes, readingMinutes, videoMinutes }
}

export function aggregateCourseDeadlineContext(
  course: DeadlineCourseRow,
): AggregatedCourseDeadlineContext {
  let totalVideoMinutes = 0
  let totalReadingMinutes = 0
  let totalActivityMinutes = 0
  let syllabusContext = `COURSE: "${course.title}"\n`

  syllabusContext += `LEVEL: ${course.level || 'Not specified'}\n`
  syllabusContext += `CATEGORY: ${getCategoryLabel(course.category)}\n`
  syllabusContext += `DESCRIPTION: ${course.description || ''}\n\n`
  syllabusContext += 'CONTENT BREAKDOWN (Real Times):\n'

  course.course_modules?.forEach((module, index) => {
    syllabusContext += `\nMODULE ${index + 1}: ${module.module_title}`

    module.course_lessons?.forEach((lesson) => {
      const minutes = getLessonMinutes(lesson)
      totalVideoMinutes += minutes.videoMinutes
      totalReadingMinutes += minutes.readingMinutes
      totalActivityMinutes += minutes.activityMinutes
      syllabusContext += `\n  - Lesson: "${lesson.lesson_title}" [Video: ${minutes.videoMinutes}m, Read: ${minutes.readingMinutes}m, Act: ${minutes.activityMinutes}m]`
    })
  })

  const dbTotalMinutes =
    totalVideoMinutes + totalReadingMinutes + totalActivityMinutes
  const finalTotalMinutes = Math.max(
    dbTotalMinutes,
    course.duration_total_minutes || 0,
    1,
  )

  return {
    dbTotalMinutes,
    finalTotalHours: finalTotalMinutes / 60,
    finalTotalMinutes,
    syllabusContext,
    totalActivityMinutes,
    totalReadingMinutes,
    totalVideoMinutes,
  }
}
