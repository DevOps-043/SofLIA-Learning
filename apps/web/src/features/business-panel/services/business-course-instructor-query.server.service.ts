import { logger } from '../../../lib/logger'
import type { BusinessCourseInstructor } from '../types/business-course-detail.types'
import type {
  BusinessCourseDetailSupabaseClient,
  InstructorRow,
} from './business-course-detail.server.types'

const INSTRUCTOR_SELECT =
  'id, first_name, last_name, display_name, username, email, profile_picture_url, bio, location, cargo_rol'

export function mapInstructor(
  instructor: InstructorRow | null,
): BusinessCourseInstructor | null {
  if (!instructor) return null

  return {
    id: instructor.id,
    name:
      instructor.display_name ||
      `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
      instructor.username ||
      'Instructor',
    email: instructor.email || '',
    profile_picture_url: instructor.profile_picture_url,
    bio: instructor.bio,
    location: instructor.location,
    cargo_rol: instructor.cargo_rol,
  }
}

export async function fetchInstructorById(
  supabase: BusinessCourseDetailSupabaseClient,
  instructorId: string,
): Promise<InstructorRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select(INSTRUCTOR_SELECT)
    .eq('id', instructorId)
    .maybeSingle<InstructorRow>()

  if (error) {
    logger.warn('Error loading course instructor by id', { error, instructorId })
  }

  return data || null
}

export async function fetchInstructorByEmail(
  supabase: BusinessCourseDetailSupabaseClient,
  email: string,
): Promise<InstructorRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select(INSTRUCTOR_SELECT)
    .eq('email', email)
    .maybeSingle<InstructorRow>()

  if (error) {
    logger.warn('Error loading generated course instructor by email', { error, email })
  }

  return data || null
}
