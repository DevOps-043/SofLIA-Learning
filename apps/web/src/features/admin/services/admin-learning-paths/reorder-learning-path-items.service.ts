import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath } from '../../types'
import { getLearningPathById } from './learning-paths.query'
import { validateLearningPathReorder } from './reorder-validation'
import type { LearningPathItemRow } from './rows'

async function updateItemPosition(
  learningPathId: string,
  itemId: string,
  position: number,
  errorMessage: string,
) {
  const supabase = createAdminClient()
  const result = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .update({ position, updated_at: new Date().toISOString() })
    .eq('learning_path_id', learningPathId)
    .eq('id', itemId)

  if (result.error) {
    logger.error(errorMessage, result.error)
    throw new Error('No se pudo reordenar el learning path')
  }
}

export async function reorderLearningPathItems(
  learningPathId: string,
  orderedItemIds: string[],
): Promise<LearningPath> {
  const currentPath = await getLearningPathById(learningPathId)
  if (!currentPath) throw new Error('Learning path no encontrado')

  validateLearningPathReorder(currentPath, orderedItemIds)

  for (const [index, itemId] of orderedItemIds.entries()) {
    await updateItemPosition(
      learningPathId,
      itemId,
      1000 + index,
      'Error staging learning path reorder:',
    )
  }

  for (const [index, itemId] of orderedItemIds.entries()) {
    await updateItemPosition(
      learningPathId,
      itemId,
      index + 1,
      'Error reordering learning path items:',
    )
  }

  const refreshed = await getLearningPathById(learningPathId)
  if (!refreshed) {
    throw new Error('No se pudo recargar el learning path')
  }

  return refreshed
}
