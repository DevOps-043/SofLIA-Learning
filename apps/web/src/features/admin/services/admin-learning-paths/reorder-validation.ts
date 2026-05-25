import type { LearningPath } from '../../types'

export function validateLearningPathReorder(
  currentPath: LearningPath,
  orderedItemIds: string[],
) {
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
