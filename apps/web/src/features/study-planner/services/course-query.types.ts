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
