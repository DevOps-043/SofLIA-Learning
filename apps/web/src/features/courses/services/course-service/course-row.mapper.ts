import { CourseDifficulty } from '@aprende-y-aplica/shared'
import type {
  AvailabilityStatus,
  CourseQueryRow,
  CourseWithInstructor,
  InstructorQueryRow,
} from './course-query.types'

export function mapCourseDifficulty(level: string | null | undefined): CourseDifficulty {
  switch (level?.toLowerCase()) {
    case 'advanced':
    case 'avanzado':
      return CourseDifficulty.ADVANCED
    case 'intermediate':
    case 'intermedio':
      return CourseDifficulty.INTERMEDIATE
    default:
      return CourseDifficulty.BEGINNER
  }
}

export function formatCoursePrice(price: number | null | undefined): string {
  return price ? `MX$${price.toFixed(0)}` : 'MX$0'
}

export function getInstructorInfo(instructor: InstructorQueryRow | null | undefined) {
  if (!instructor) {
    return {
      name: 'Instructor',
      email: 'instructor@example.com',
    }
  }

  return {
    name:
      `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
      instructor.username ||
      'Instructor',
    email: instructor.email || 'instructor@example.com',
  }
}

export function mapCourseRowToCourse(
  course: CourseQueryRow,
  options?: {
    isFavorite?: boolean
    status?: AvailabilityStatus
  },
): CourseWithInstructor {
  const instructorInfo = getInstructorInfo(course.instructor)
  const learningObjectives = Array.isArray(course.learning_objectives)
    ? course.learning_objectives.filter(
        (objective): objective is string => typeof objective === 'string',
      )
    : []

  return {
    id: course.id,
    title: course.title,
    description: course.description || '',
    thumbnail: course.thumbnail_url || undefined,
    status: options?.status || 'Disponible',
    estimatedDuration: course.duration_total_minutes || 0,
    difficulty: mapCourseDifficulty(course.level),
    isPublic: course.is_active ?? false,
    createdAt: new Date(course.created_at || Date.now()),
    updatedAt: new Date(course.updated_at || course.created_at || Date.now()),
    modules: [],
    category: course.category,
    instructor_id: course.instructor_id,
    slug: course.slug,
    rating: course.average_rating || 0,
    price: formatCoursePrice(course.price),
    isFavorite: options?.isFavorite || false,
    instructor_name: instructorInfo.name,
    instructor_email: instructorInfo.email,
    student_count: course.student_count || 0,
    review_count: course.review_count || 0,
    learning_objectives: learningObjectives,
  }
}
