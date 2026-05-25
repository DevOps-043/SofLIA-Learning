import type { Course, CourseDifficulty } from '@aprende-y-aplica/shared'
import type { Json } from '../../../../lib/supabase/types'

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
