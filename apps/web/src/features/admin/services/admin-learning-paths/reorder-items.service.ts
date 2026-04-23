import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath } from '../../types'
import type { LearningPathItemRow } from './learning-path-row.types'
import { getLearningPathById } from './read-learning-paths.service'

function validateRequestedOrder(currentPath: LearningPath, orderedItemIds: string[]) {
  if (orderedItemIds.length !== currentPath.items.length) {
    throw new Error('El nuevo orden no coincide con los items actuales')
  }

  const currentItemIds = new Set(currentPath.items.map((item) => item.id))
  const requestedItemIds = new Set(orderedItemIds)

  if (currentItemIds.size !== requestedItemIds.size) {
    throw new Error('El nuevo orden contiene elementos duplicados')
  }

  for (const itemId of orderedItemIds) {
    if (!currentItemIds.has(itemId)) {
      throw new Error('El nuevo orden contiene items invalidos')
    }
  }
}

async function updateItemPosition(itemId: string, learningPathId: string, position: number) {
  const supabase = createAdminClient()
  const result = await fromLoose<LearningPathItemRow>(supabase, 'learning_path_items')
    .update({ position, updated_at: new Date().toISOString() })
    .eq('learning_path_id', learningPathId)
    .eq('id', itemId)

  return result.error
}

export async function reorderLearningPathItems(
  learningPathId: string,
  orderedItemIds: string[],
): Promise<LearningPath> {
  const currentPath = await getLearningPathById(learningPathId)
  if (!currentPath) {
    throw new Error('Learning path no encontrado')
  }

  validateRequestedOrder(currentPath, orderedItemIds)

  for (const [index, itemId] of orderedItemIds.entries()) {
    const error = await updateItemPosition(itemId, learningPathId, 1000 + index)
    if (error) {
      logger.error('Error staging learning path reorder:', error)
      throw new Error('No se pudo preparar el reordenamiento del learning path')
    }
  }

  for (const [index, itemId] of orderedItemIds.entries()) {
    const error = await updateItemPosition(itemId, learningPathId, index + 1)
    if (error) {
      logger.error('Error reordering learning path items:', error)
      throw new Error('No se pudo reordenar el learning path')
    }
  }

  const refreshed = await getLearningPathById(learningPathId)
  if (!refreshed) {
    throw new Error('No se pudo recargar el learning path')
  }

  return refreshed
}
