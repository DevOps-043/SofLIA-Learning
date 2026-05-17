import type { StudyPlannerCourseOption } from '../../types/planner-ui.types'
import { formatPlannerDisplayDate } from './date-format'
import type { GroupedDistributionDay } from './types'

export function appendExistingSchedules(
  lines: string[],
  groupedDays: GroupedDistributionDay[],
  options?: { includeStudyLabel?: boolean; includeEmptyState?: boolean },
): void {
  groupedDays.forEach(({ dateStr, dayName, items }) => {
    lines.push(`**${formatPlannerDisplayDate(dateStr, dayName)}:**`)

    items.forEach((item) => {
      const heading = options?.includeStudyLabel
        ? `De ${item.startTime} a ${item.endTime}. Lecciones a estudiar:`
        : `De ${item.startTime} a ${item.endTime}:`

      lines.push(heading)
      appendLessonTitles(lines, item.lessons, options)
    })

    lines.push('')
  })
}

export function appendSelectedCourses(
  lines: string[],
  courses: StudyPlannerCourseOption[],
  selectedCourseIds: string[],
): void {
  lines.push('**Curso(s) seleccionado(s):**')

  selectedCourseIds.forEach((courseId) => {
    const course = courses.find((item) => item.id === courseId)
    if (course) {
      lines.push(`- ${course.title}`)
    }
  })

  lines.push('')
}

function appendLessonTitles(
  lines: string[],
  lessons: GroupedDistributionDay['items'][number]['lessons'],
  options?: { includeStudyLabel?: boolean; includeEmptyState?: boolean },
): void {
  const lessonTitles = lessons
    ?.map((lesson) => lesson?.lessonTitle?.trim())
    .filter((lessonTitle): lessonTitle is string => Boolean(lessonTitle)) ?? []

  if (lessonTitles.length === 0 && options?.includeEmptyState) {
    lines.push('- Sin lecciones asignadas')
    return
  }

  lessonTitles.forEach((lessonTitle) => {
    const prefix = options?.includeStudyLabel ? '- ' : '  - '
    lines.push(`${prefix}${lessonTitle}`)
  })
}
