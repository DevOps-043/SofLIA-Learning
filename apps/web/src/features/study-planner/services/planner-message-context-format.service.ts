import type { StudyPlannerCourseOption } from '../types/planner-ui.types'
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

const HOLIDAY_SUFFIXES = ['-01-01', '-12-25', '-05-01', '-09-16', '-11-20'] as const

export interface GroupedDistributionDay {
  dateStr: string
  dayName: string
  items: StudyPlannerStoredLessonDistribution[]
}

export function formatPlannerDisplayDate(dateStr: string, dayName: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const day = Number.parseInt(parts[2], 10)
      const month = Number.parseInt(parts[1], 10) - 1
      const year = Number.parseInt(parts[0], 10)

      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year) && MONTH_NAMES[month]) {
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
        return `${capitalizedDay} ${day} de ${MONTH_NAMES[month]} de ${year}`
      }
    }
  } catch (error) {
    console.error('Error formatting planner date:', error)
  }

  return `${dayName} ${dateStr}`
}

export function countAssignedLessons(distribution: StudyPlannerStoredLessonDistribution[]): number {
  return distribution.reduce((total, item) => {
    const lessonCount = item.lessons?.filter((lesson) => lesson?.lessonTitle?.trim()).length ?? 0
    return total + lessonCount
  }, 0)
}

export function groupDistributionByDay(
  distribution: StudyPlannerStoredLessonDistribution[],
  options?: { excludeHolidayDates?: boolean },
): GroupedDistributionDay[] {
  const grouped = new Map<string, StudyPlannerStoredLessonDistribution[]>()

  distribution.forEach((item) => {
    if (!item?.dateStr || !item.startTime || !item.endTime) {
      return
    }

    if (options?.excludeHolidayDates && HOLIDAY_SUFFIXES.some((suffix) => item.dateStr.includes(suffix))) {
      return
    }

    const current = grouped.get(item.dateStr) ?? []
    current.push(item)
    grouped.set(item.dateStr, current)
  })

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([dateStr, items]) => ({
      dateStr,
      dayName: items[0]?.dayName ?? '',
      items,
    }))
}

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

      const lessonTitles = item.lessons
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
