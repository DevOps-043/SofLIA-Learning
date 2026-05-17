import type { AdminWorkshop } from './workshops-transform.service'
import type {
  CourseWorkshopRow,
  EnrollmentCourseRow,
  InstructorLookupRow,
  ModuleDurationRow,
} from './workshops-query.types'

export function normalizeSearchTerm(search?: string) {
  return search?.trim().replace(/[%_,()]/g, '') || ''
}

export function getPaginationBounds(page: number, limit: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), 48)
    : 24
  const from = (safePage - 1) * safeLimit
  const to = from + safeLimit - 1

  return { safePage, safeLimit, from, to }
}

export function getInstructorDisplayName(instructor: InstructorLookupRow) {
  return instructor.display_name ||
    `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
    'Instructor no asignado'
}

export function enrichWorkshops(input: {
  courses: CourseWorkshopRow[]
  instructors: InstructorLookupRow[]
  modules: ModuleDurationRow[]
  enrollments: EnrollmentCourseRow[]
}): AdminWorkshop[] {
  const instructorsMap = new Map<string, { name: string; picture: string | null }>(
    input.instructors.map((instructor) => [
      instructor.id,
      {
        name: getInstructorDisplayName(instructor),
        picture: instructor.profile_picture_url,
      },
    ]),
  )
  const durationMap = sumByCourse(input.modules, 'module_duration_minutes')
  const enrollmentsMap = countByCourse(input.enrollments)

  return input.courses.map((workshop): AdminWorkshop => {
    const instructor = workshop.instructor_id
      ? instructorsMap.get(workshop.instructor_id)
      : null
    const calculatedDuration = durationMap.get(workshop.id) || 0

    return {
      ...workshop,
      instructor_id: workshop.instructor_id || '',
      duration_total_minutes: calculatedDuration > 0
        ? calculatedDuration
        : (workshop.duration_total_minutes || 0),
      student_count: enrollmentsMap.get(workshop.id) || 0,
      instructor_name: instructor?.name || 'Instructor no asignado',
      instructor_profile_picture_url: instructor?.picture || null,
    }
  })
}

function sumByCourse(rows: ModuleDurationRow[], field: 'module_duration_minutes') {
  const durationMap = new Map<string, number>()
  for (const row of rows) {
    durationMap.set(row.course_id, (durationMap.get(row.course_id) || 0) + (row[field] || 0))
  }
  return durationMap
}

function countByCourse(rows: EnrollmentCourseRow[]) {
  const countMap = new Map<string, number>()
  for (const row of rows) {
    countMap.set(row.course_id, (countMap.get(row.course_id) || 0) + 1)
  }
  return countMap
}
