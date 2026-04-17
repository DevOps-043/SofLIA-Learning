import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface LearningPathAccessItem {
  courseId: string
  slug: string | null
  title: string
  position: number
  isCompleted: boolean
  isUnlocked: boolean
  isCurrent: boolean
}

export interface LearningPathAccessState {
  learningPathId: string
  title: string
  description: string | null
  currentCourseId: string
  currentCourseUnlocked: boolean
  progressPercentage: number
  completedItemsCount: number
  totalItemsCount: number
  items: LearningPathAccessItem[]
}

interface LearningPathRow {
  id: string
  title: string
  description: string | null
  is_active: boolean | null
}

interface LearningPathItemFlatRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
}

interface CourseMinRow {
  id: string
  slug: string | null
  title: string | null
}

interface EnrollmentRow {
  course_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
}

interface UserLearningPathProgressRow {
  id: string
}

interface QueryLikeError {
  code?: string
  message?: string
  details?: string
}

function isCourseCompleted(enrollment: EnrollmentRow | undefined) {
  if (!enrollment) return false

  return (
    enrollment.enrollment_status === 'completed' ||
    (enrollment.overall_progress_percentage ?? 0) >= 100
  )
}

function isMissingLearningPathInfrastructureError(error: QueryLikeError | null | undefined) {
  if (!error) return false

  const combined = `${error.code || ''} ${error.message || ''} ${error.details || ''}`.toLowerCase()

  return (
    error.code === '42P01' ||
    combined.includes('does not exist') ||
    combined.includes('relation') ||
    combined.includes('learning_path')
  )
}

async function loadAssignedLearningPathIds(
  userId: string,
  organizationId?: string | null,
) {
  const supabase = await createClient()
  const assignedIds = new Set<string>()

  if (organizationId) {
    const { data: organizationAssignments, error: orgError } = await supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .returns<{ learning_path_id: string }[]>()

    if (orgError) {
      if (isMissingLearningPathInfrastructureError(orgError)) {
        return []
      }
      logger.error('Error loading organization learning path assignments:', orgError)
      throw new Error('No se pudo validar el acceso al learning path')
    }

    for (const row of organizationAssignments || []) {
      assignedIds.add(row.learning_path_id)
    }
  }

  const userQuery = supabase
    .from('user_learning_path_assignments')
    .select('learning_path_id')
    .eq('user_id', userId)
    .eq('status', 'assigned')

  if (organizationId) {
    userQuery.eq('organization_id', organizationId)
  }

  const { data: userAssignments, error: userError } = await userQuery.returns<{ learning_path_id: string }[]>()

  if (userError) {
    if (isMissingLearningPathInfrastructureError(userError)) {
      return []
    }
    logger.error('Error loading user learning path assignments:', userError)
    throw new Error('No se pudo validar el acceso al learning path')
  }

  for (const row of userAssignments || []) {
    assignedIds.add(row.learning_path_id)
  }

  return [...assignedIds]
}

async function persistProgressSnapshot(
  userId: string,
  organizationId: string | null | undefined,
  state: LearningPathAccessState,
) {
  const supabase = await createClient()
  const currentCourse = state.items.find((item) => item.isCurrent)
  const nextCourse = state.items.find((item) => !item.isCompleted && item.isUnlocked)

  const { data: existing, error: existingError } = await supabase
    .from('user_learning_path_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('learning_path_id', state.learningPathId)
    .maybeSingle()
    .returns<UserLearningPathProgressRow>()

  if (existingError) {
    if (isMissingLearningPathInfrastructureError(existingError)) {
      return
    }
    logger.error('Error checking learning path progress snapshot:', existingError)
    return
  }

  const payload = {
    organization_id: organizationId || null,
    user_id: userId,
    learning_path_id: state.learningPathId,
    completed_items_count: state.completedItemsCount,
    total_items_count: state.totalItemsCount,
    progress_percentage: state.progressPercentage,
    current_course_id: currentCourse?.courseId || null,
    next_course_id: nextCourse?.courseId || null,
    status:
      state.progressPercentage >= 100
        ? 'completed'
        : state.completedItemsCount > 0
          ? 'in_progress'
          : 'not_started',
    completed_at: state.progressPercentage >= 100 ? new Date().toISOString() : null,
    last_unlocked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('user_learning_path_progress')
      .update(payload)
      .eq('id', existing.id)

    if (updateError) {
      if (isMissingLearningPathInfrastructureError(updateError)) {
        return
      }
      logger.error('Error updating learning path progress snapshot:', updateError)
    }
    return
  }

  const { error: insertError } = await supabase
    .from('user_learning_path_progress')
    .insert(payload)

  if (insertError) {
    if (isMissingLearningPathInfrastructureError(insertError)) {
      return
    }
    logger.error('Error inserting learning path progress snapshot:', insertError)
  }
}

export async function resolveLearningPathAccessForCourse(params: {
  userId: string
  courseId: string
  organizationId?: string | null
}) {
  const { userId, courseId, organizationId } = params
  const supabase = await createClient()
  const assignedPathIds = await loadAssignedLearningPathIds(userId, organizationId)

  if (assignedPathIds.length === 0) {
    return null
  }

  // =====================================================
  // STEP 1: Find learning path items that contain this course
  // (flat query — no nested joins to avoid RLS cascading failures)
  // =====================================================
  const { data: candidateItems, error: candidateItemsError } = await supabase
    .from('learning_path_items')
    .select('learning_path_id, position')
    .eq('course_id', courseId)
    .in('learning_path_id', assignedPathIds)
    .order('position', { ascending: true })
    .returns<{ learning_path_id: string; position: number }[]>()

  if (candidateItemsError) {
    if (isMissingLearningPathInfrastructureError(candidateItemsError)) {
      return null
    }
    logger.error('Error loading learning path candidates for course:', candidateItemsError)
    throw new Error('No se pudo resolver el learning path del curso')
  }

  if (!candidateItems || candidateItems.length === 0) {
    return null
  }

  // Get the parent learning path info separately
  const candidatePathIds = [...new Set(candidateItems.map((item) => item.learning_path_id))]
  const { data: candidatePaths, error: candidatePathsError } = await supabase
    .from('learning_paths')
    .select('id, title, description, is_active')
    .in('id', candidatePathIds)
    .eq('is_active', true)
    .returns<LearningPathRow[]>()

  if (candidatePathsError) {
    if (isMissingLearningPathInfrastructureError(candidatePathsError)) {
      return null
    }
    logger.error('Error loading candidate learning paths:', candidatePathsError)
    throw new Error('No se pudo resolver el learning path del curso')
  }

  if (!candidatePaths || candidatePaths.length === 0) {
    return null
  }

  // Pick the first active path that contains this course
  const selectedPath = candidatePaths[0]

  // =====================================================
  // STEP 2: Load all items for the selected path (flat) + courses separately
  // =====================================================
  const { data: flatItems, error: flatItemsError } = await supabase
    .from('learning_path_items')
    .select('id, learning_path_id, course_id, position')
    .eq('learning_path_id', selectedPath.id)
    .order('position', { ascending: true })
    .returns<LearningPathItemFlatRow[]>()

  if (flatItemsError) {
    if (isMissingLearningPathInfrastructureError(flatItemsError)) {
      return null
    }
    logger.error('Error loading learning path items for access resolution:', flatItemsError)
    throw new Error('No se pudo resolver la secuencia del learning path')
  }

  const items = flatItems || []
  const itemCourseIds = items.map((item) => item.course_id)

  // Load course info + enrollments in parallel
  const [
    { data: courses, error: coursesError },
    { data: enrollmentRows, error: enrollmentError },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('id, slug, title')
      .in('id', itemCourseIds)
      .returns<CourseMinRow[]>(),
    supabase
      .from('user_course_enrollments')
      .select('course_id, organization_id, overall_progress_percentage, enrollment_status')
      .eq('user_id', userId)
      .in('course_id', itemCourseIds)
      .returns<EnrollmentRow[]>(),
  ])

  if (coursesError) {
    logger.error('Error loading courses for learning path access:', coursesError)
    return null
  }

  if (enrollmentError) {
    if (isMissingLearningPathInfrastructureError(enrollmentError)) {
      return null
    }
    logger.error('Error loading enrollments for learning path access:', enrollmentError)
    throw new Error('No se pudo validar el progreso del learning path')
  }

  // Build maps
  const courseMap = new Map<string, CourseMinRow>()
  for (const course of courses || []) {
    courseMap.set(course.id, course)
  }

  const enrollmentMap = new Map<string, EnrollmentRow>()
  for (const enrollment of enrollmentRows || []) {
    const current = enrollmentMap.get(enrollment.course_id)

    if (!current) {
      enrollmentMap.set(enrollment.course_id, enrollment)
      continue
    }

    const currentMatchesOrg = current.organization_id === organizationId
    const nextMatchesOrg = enrollment.organization_id === organizationId
    if (!currentMatchesOrg && nextMatchesOrg) {
      enrollmentMap.set(enrollment.course_id, enrollment)
    }
  }

  let previousCourseCompleted = true
  let completedItemsCount = 0

  const mappedItems = items.map((item) => {
    const completed = isCourseCompleted(enrollmentMap.get(item.course_id))
    const unlocked = previousCourseCompleted
    const current = item.course_id === courseId
    const courseInfo = courseMap.get(item.course_id)

    if (completed) {
      completedItemsCount += 1
    }

    previousCourseCompleted = previousCourseCompleted && completed

    return {
      courseId: item.course_id,
      slug: courseInfo?.slug || null,
      title: courseInfo?.title || 'Curso sin título',
      position: item.position,
      isCompleted: completed,
      isUnlocked: unlocked,
      isCurrent: current,
    }
  })

  const totalItemsCount = mappedItems.length
  const progressPercentage =
    totalItemsCount > 0
      ? Math.round((completedItemsCount / totalItemsCount) * 100)
      : 0

  const state: LearningPathAccessState = {
    learningPathId: selectedPath.id,
    title: selectedPath.title,
    description: selectedPath.description,
    currentCourseId: courseId,
    currentCourseUnlocked:
      mappedItems.find((item) => item.courseId === courseId)?.isUnlocked ?? true,
    progressPercentage,
    completedItemsCount,
    totalItemsCount,
    items: mappedItems,
  }

  await persistProgressSnapshot(userId, organizationId, state)

  return state
}
