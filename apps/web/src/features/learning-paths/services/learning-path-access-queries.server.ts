import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { isMissingLearningPathInfrastructureError } from './learning-path-access.errors'
import type {
  CourseMinRow,
  EnrollmentRow,
  LearningPathItemFlatRow,
  LearningPathRow,
} from './learning-path-access.types'

export async function loadSelectedLearningPathForCourse(
  courseId: string,
  assignedPathIds: string[],
) {
  const supabase = await createClient()
  const { data: candidateItems, error } = await supabase
    .from('learning_path_items')
    .select('learning_path_id, position')
    .eq('course_id', courseId)
    .in('learning_path_id', assignedPathIds)
    .order('position', { ascending: true })
    .returns<{ learning_path_id: string; position: number }[]>()

  if (error) return handleNullableQueryError(error, 'Error loading learning path candidates for course:')
  if (!candidateItems?.length) return null

  const candidatePathIds = [...new Set(candidateItems.map((item) => item.learning_path_id))]
  const { data: candidatePaths, error: candidatePathsError } = await supabase
    .from('learning_paths')
    .select('id, title, description, is_active')
    .in('id', candidatePathIds)
    .eq('is_active', true)
    .returns<LearningPathRow[]>()

  if (candidatePathsError) {
    return handleNullableQueryError(candidatePathsError, 'Error loading candidate learning paths:')
  }

  return candidatePaths?.[0] || null
}

export async function loadLearningPathItems(pathId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_path_items')
    .select('id, learning_path_id, course_id, position')
    .eq('learning_path_id', pathId)
    .order('position', { ascending: true })
    .returns<LearningPathItemFlatRow[]>()

  if (!error) return data || []
  if (isMissingLearningPathInfrastructureError(error)) return null

  logger.error('Error loading learning path items for access resolution:', error)
  throw new Error('No se pudo resolver la secuencia del learning path')
}

export async function loadCourseAndEnrollmentRows(
  userId: string,
  itemCourseIds: string[],
) {
  const supabase = await createClient()
  const [coursesResult, enrollmentResult] = await Promise.all([
    supabase.from('courses').select('id, slug, title').in('id', itemCourseIds).returns<CourseMinRow[]>(),
    supabase
      .from('user_course_enrollments')
      .select('course_id, organization_id, overall_progress_percentage, enrollment_status')
      .eq('user_id', userId)
      .in('course_id', itemCourseIds)
      .returns<EnrollmentRow[]>(),
  ])

  if (coursesResult.error) {
    logger.error('Error loading courses for learning path access:', coursesResult.error)
    return null
  }

  return {
    courses: coursesResult.data || [],
    enrollmentRows: enrollmentResult.data || [],
    enrollmentError: enrollmentResult.error,
  }
}

function handleNullableQueryError(error: unknown, message: string) {
  if (isMissingLearningPathInfrastructureError(error as never)) return null

  logger.error(message, error)
  throw new Error('No se pudo resolver el learning path del curso')
}
