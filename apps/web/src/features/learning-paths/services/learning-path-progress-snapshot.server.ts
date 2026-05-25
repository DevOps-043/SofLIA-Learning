import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { isMissingLearningPathInfrastructureError } from './learning-path-access.errors'
import type {
  LearningPathAccessState,
  UserLearningPathProgressRow,
} from './learning-path-access.types'

export async function persistProgressSnapshot(
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
    logSnapshotError('checking', existingError)
    return
  }

  const payload = buildProgressSnapshotPayload(userId, organizationId, state, {
    currentCourseId: currentCourse?.courseId || null,
    nextCourseId: nextCourse?.courseId || null,
  })

  const { error } = existing
    ? await supabase.from('user_learning_path_progress').update(payload).eq('id', existing.id)
    : await supabase.from('user_learning_path_progress').insert(payload)

  if (error) logSnapshotError(existing ? 'updating' : 'inserting', error)
}

function buildProgressSnapshotPayload(
  userId: string,
  organizationId: string | null | undefined,
  state: LearningPathAccessState,
  courseRefs: { currentCourseId: string | null; nextCourseId: string | null },
) {
  return {
    organization_id: organizationId || null,
    user_id: userId,
    learning_path_id: state.learningPathId,
    completed_items_count: state.completedItemsCount,
    total_items_count: state.totalItemsCount,
    progress_percentage: state.progressPercentage,
    current_course_id: courseRefs.currentCourseId,
    next_course_id: courseRefs.nextCourseId,
    status: state.progressPercentage >= 100
      ? 'completed'
      : state.completedItemsCount > 0 ? 'in_progress' : 'not_started',
    completed_at: state.progressPercentage >= 100 ? new Date().toISOString() : null,
    last_unlocked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function logSnapshotError(action: string, error: unknown) {
  if (isMissingLearningPathInfrastructureError(error as never)) return
  logger.error(`Error ${action} learning path progress snapshot:`, error)
}
