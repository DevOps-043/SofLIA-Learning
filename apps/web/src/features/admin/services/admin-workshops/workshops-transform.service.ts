/**
 * Workshop interfaces and type definitions
 */

export interface AdminWorkshop {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  instructor_id: string
  instructor_name?: string
  instructor_profile_picture_url?: string | null
  is_active: boolean
  thumbnail_url?: string
  slug: string
  price?: number
  average_rating?: number
  student_count: number
  review_count: number
  learning_objectives?: string[] | null
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface WorkshopStats {
  totalWorkshops: number
  activeWorkshops: number
  totalStudents: number
  averageDuration: number
  totalInstructors: number
}

export interface AdminWorkshopListFilters {
  page: number
  limit: number
  search?: string
  category?: string
  status?: 'active' | 'inactive'
}

export interface AdminWorkshopListResult {
  workshops: AdminWorkshop[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
