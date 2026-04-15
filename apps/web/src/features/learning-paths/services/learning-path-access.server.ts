import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

interface LooseRow {
  [key: string]: unknown
}

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

interface LearningPathCandidateRow {
  learning_path_id: string
  position: number
  learning_paths?: {
    id: string
    title: string
    description: string | null
    is_active: boolean | null
  } | null
}

interface LearningPathItemRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  courses?: {
    id: string
    slug: string | null
    title: string | null
  } | null
}

interface EnrollmentRow {
  course_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
}

interface UserLearningPathProgressRow extends LooseRow {
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
    const organizationAssignments = await fromLoose<{ learning_path_id: string }>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select('learning_path_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (organizationAssignments.error) {
      if (isMissingLearningPathInfrastructureError(organizationAssignments.error)) {
        return []
      }
      logger.error('Error loading organization learning path assignments:', organizationAssignments.error)
      throw new Error('No se pudo validar el acceso al learning path')
    }

    for (const row of organizationAssignments.data || []) {
      assignedIds.add(row.learning_path_id)
    }
  }

  let userAssignmentsQuery = fromLoose<{ learning_path_id: string }>(
    supabase,
    'user_learning_path_assignments',
  )
    .select('learning_path_id')
    .eq('user_id', userId)
    .eq('status', 'assigned')

  if (organizationId) {
    userAssignmentsQuery = userAssignmentsQuery.eq('organization_id', organizationId)
  }

  const userAssignments = await userAssignmentsQuery

  if (userAssignments.error) {
    if (isMissingLearningPathInfrastructureError(userAssignments.error)) {
      return []
    }
    logger.error('Error loading user learning path assignments:', userAssignments.error)
    throw new Error('No se pudo validar el acceso al learning path')
  }

  for (const row of userAssignments.data || []) {
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

  const existing = await fromLoose<UserLearningPathProgressRow>(
    supabase,
    'user_learning_path_progress',
  )
    .select('id')
    .eq('user_id', userId)
    .eq('learning_path_id', state.learningPathId)
    .maybeSingle()

  if (existing.error) {
    if (isMissingLearningPathInfrastructureError(existing.error)) {
      return
    }
    logger.error('Error checking learning path progress snapshot:', existing.error)
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

  if (existing.data) {
    const updateResult = await fromLoose<UserLearningPathProgressRow>(
      supabase,
      'user_learning_path_progress',
    )
      .update(payload)
      .eq('id', existing.data.id)

    if (updateResult.error) {
      if (isMissingLearningPathInfrastructureError(updateResult.error)) {
        return
      }
      logger.error('Error updating learning path progress snapshot:', updateResult.error)
    }
    return
  }

  const insertResult = await fromLoose<UserLearningPathProgressRow>(
    supabase,
    'user_learning_path_progress',
  )
    .insert(payload)

  if (insertResult.error) {
    if (isMissingLearningPathInfrastructureError(insertResult.error)) {
      return
    }
    logger.error('Error inserting learning path progress snapshot:', insertResult.error)
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

  const candidates = await fromLoose<LearningPathCandidateRow>(supabase, 'learning_path_items')
    .select(`
      learning_path_id,
      position,
      learning_paths!inner (
        id,
        title,
        description,
        is_active
      )
    `)
    .eq('course_id', courseId)
    .in('learning_path_id', assignedPathIds)
    .order('position', { ascending: true })

  if (candidates.error) {
    if (isMissingLearningPathInfrastructureError(candidates.error)) {
      return null
    }
    logger.error('Error loading learning path candidates for course:', candidates.error)
    throw new Error('No se pudo resolver el learning path del curso')
  }

  const selectedCandidate = (candidates.data || []).find(
    (candidate) => candidate.learning_paths?.is_active !== false,
  )

  if (!selectedCandidate?.learning_paths) {
    return null
  }

  const itemsResult = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .select(`
      id,
      learning_path_id,
      course_id,
      position,
      courses (
        id,
        slug,
        title
      )
    `)
    .eq('learning_path_id', selectedCandidate.learning_path_id)
    .order('position', { ascending: true })

  if (itemsResult.error) {
    if (isMissingLearningPathInfrastructureError(itemsResult.error)) {
      return null
    }
    logger.error('Error loading learning path items for access resolution:', itemsResult.error)
    throw new Error('No se pudo resolver la secuencia del learning path')
  }

  const items = itemsResult.data || []
  const courseIds = items.map((item) => item.course_id)

  const enrollments = await supabase
    .from('user_course_enrollments')
    .select('course_id, organization_id, overall_progress_percentage, enrollment_status')
    .eq('user_id', userId)
    .in('course_id', courseIds)

  if (enrollments.error) {
    if (isMissingLearningPathInfrastructureError(enrollments.error)) {
      return null
    }
    logger.error('Error loading enrollments for learning path access:', enrollments.error)
    throw new Error('No se pudo validar el progreso del learning path')
  }

  const enrollmentMap = new Map<string, EnrollmentRow>()
  for (const enrollment of (enrollments.data || []) as EnrollmentRow[]) {
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

    if (completed) {
      completedItemsCount += 1
    }

    previousCourseCompleted = previousCourseCompleted && completed

    return {
      courseId: item.course_id,
      slug: item.courses?.slug || null,
      title: item.courses?.title || 'Curso sin título',
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
    learningPathId: selectedCandidate.learning_paths.id,
    title: selectedCandidate.learning_paths.title,
    description: selectedCandidate.learning_paths.description,
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
