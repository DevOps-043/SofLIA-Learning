import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { CourseAccessCleanupResult } from './course-access-provenance-cleanup.service'
import { revokeCourseAccessSourcedFromLearningPath } from './course-access-provenance-cleanup.service'
import type { LearningPathItemRow } from './rows'

export async function removeLearningPathItem(
  learningPathId: string,
  itemId: string,
): Promise<CourseAccessCleanupResult> {
  const supabase = createAdminClient()
  const { data: item, error: itemError } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .select('id, learning_path_id, course_id, position')
    .eq('learning_path_id', learningPathId)
    .eq('id', itemId)
    .maybeSingle()

  if (itemError) {
    logger.error('Error loading learning path item:', itemError)
    throw new Error('No se pudo cargar el item del learning path')
  }

  if (!item) throw new Error('Item del learning path no encontrado')

  const { error } = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    logger.error('Error removing learning path item:', error)
    throw new Error('No se pudo eliminar el item del learning path')
  }

  const cleanup = await revokeCourseAccessSourcedFromLearningPath({
    learningPathId,
    courseIds: [item.course_id],
  })

  const { data: remaining, error: remainingError } = await fromLoose<LearningPathItemRow>(
    supabase,
    'learning_path_items',
  )
    .select('id, learning_path_id, course_id, position')
    .eq('learning_path_id', learningPathId)
    .order('position', { ascending: true })

  if (remainingError) {
    logger.error('Error reloading remaining learning path items:', remainingError)
    throw new Error('No se pudo reordenar el learning path')
  }

  for (const [index, row] of (remaining || []).entries()) {
    const expectedPosition = index + 1
    if (row.position === expectedPosition) continue

    const updateResult = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
      .update({ position: expectedPosition, updated_at: new Date().toISOString() })
      .eq('id', row.id)

    if (updateResult.error) {
      logger.error('Error compacting learning path positions:', updateResult.error)
      throw new Error('No se pudo reordenar el learning path')
    }
  }

  return cleanup
}
