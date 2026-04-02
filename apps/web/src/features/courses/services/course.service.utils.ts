import { Course, CourseDifficulty } from '@aprende-y-aplica/shared'
import type { Json } from '../../../lib/supabase/types'

export type AvailabilityStatus = 'Adquirido' | 'Disponible'

export interface CourseWithInstructor extends Omit<Course, 'status' | 'difficulty'> {
  instructor_id?: string | null
  instructor_name?: string
  instructor_email?: string
  category?: string | null
  slug?: string | null
  rating?: number
  price?: string
  status?: AvailabilityStatus
  isFavorite?: boolean
  student_count?: number
  review_count?: number
  learning_objectives?: string[]
  difficulty: CourseDifficulty
}

export interface InstructorQueryRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  username: string | null
}

export interface CourseQueryRow {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor_id: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
  slug: string | null
  is_active: boolean | null
  price?: number | null
  average_rating?: number | null
  student_count?: number | null
  review_count?: number | null
  learning_objectives?: Json | null
  created_at: string | null
  updated_at: string | null
  instructor?: InstructorQueryRow | null
}

export interface FavoriteQueryRow {
  course_id: string
}

export interface PurchaseQueryRow {
  course_id: string
  access_status: string | null
}

export interface QueryResult<TData> {
  data: TData[] | null
  error: {
    message: string
  } | null
}

export interface SingleQueryResult<TData> {
  data: TData | null
  error: {
    message: string
  } | null
}

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

export function extractFavoriteCourseIds(
  result: QueryResult<FavoriteQueryRow> | null | undefined,
): string[] {
  if (!result?.data || result.error) {
    return []
  }

  return result.data.map((favorite) => favorite.course_id)
}

export function extractPurchasedCourseIds(
  result: QueryResult<PurchaseQueryRow> | null | undefined,
): string[] {
  if (!result?.data || result.error) {
    return []
  }

  const activePurchases = result.data
    .filter((purchase) => purchase.access_status === 'active')
    .map((purchase) => purchase.course_id)

  return activePurchases.length > 0
    ? activePurchases
    : result.data.map((purchase) => purchase.course_id)
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
