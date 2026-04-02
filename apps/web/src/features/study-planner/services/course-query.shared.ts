import type {
  AssignmentStatus,
  CourseInfo,
  CourseLevel,
} from '../types/user-context.types'

export interface CourseRow {
  id: string
  title: string
  description?: string | null
  slug: string
  category: string
  level?: string | null
  instructor_id?: string | null
  thumbnail_url?: string | null
  duration_total_minutes?: number | null
  is_active?: boolean | null
  price?: number | null
  average_rating?: number | null
  student_count?: number | null
}

export interface PersonNameRow {
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

export const COURSE_INFO_SELECT = `
  id,
  title,
  description,
  slug,
  category,
  level,
  instructor_id,
  thumbnail_url,
  duration_total_minutes,
  is_active,
  price,
  average_rating,
  student_count
`

export const PERSON_NAME_SELECT = `
  display_name,
  first_name,
  last_name
`

export function normalizeOptionalString(
  value?: string | null,
): string | undefined {
  return value ?? undefined
}

export function mapCourseLevel(level?: string | null): CourseLevel {
  if (level === 'intermediate' || level === 'advanced') {
    return level
  }

  return 'beginner'
}

export function mapPersonName(person?: PersonNameRow | null): string | undefined {
  if (!person) {
    return undefined
  }

  if (person.display_name) {
    return person.display_name
  }

  if (person.first_name && person.last_name) {
    return `${person.first_name} ${person.last_name}`
  }

  return person.first_name ?? person.last_name ?? undefined
}

export function mapCourseInfo(
  course: CourseRow,
  options?: { instructorName?: string },
): CourseInfo {
  return {
    id: course.id,
    title: course.title,
    description: normalizeOptionalString(course.description),
    slug: course.slug,
    category: course.category,
    level: mapCourseLevel(course.level),
    instructorId: normalizeOptionalString(course.instructor_id),
    instructorName: options?.instructorName,
    thumbnailUrl: normalizeOptionalString(course.thumbnail_url),
    durationTotalMinutes: course.duration_total_minutes ?? 0,
    isActive: course.is_active ?? false,
    price: course.price ?? undefined,
    averageRating: course.average_rating ?? undefined,
    studentCount: course.student_count ?? undefined,
  }
}

export function mapAssignmentStatus(status?: string | null): AssignmentStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'in_progress':
      return 'in_progress'
    case 'overdue':
      return 'overdue'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'assigned'
  }
}
