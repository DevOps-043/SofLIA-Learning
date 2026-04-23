export type LooseRow = Record<string, unknown>

export type SupabaseMutationError = {
  message: string
  code?: string
  details?: string
} | null

export interface LearningPathRow extends LooseRow {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface LearningPathItemCourseRow {
  id: string
  title: string | null
  slug: string | null
  thumbnail_url: string | null
  category: string | null
  level: string | null
}

export interface LearningPathItemRow extends LooseRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  courses?: LearningPathItemCourseRow | null
}
