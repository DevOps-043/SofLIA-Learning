import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathItem } from '../../types'
import { LEARNING_PATH_ITEM_SELECT } from './selects'
import { mapLearningPathItems } from './learning-path-mappers'
import type { LearningPathItemRow } from './learning-path-row.types'

export async function loadItemsByPathIds(pathIds: string[]) {
  if (pathIds.length === 0) {
    return new Map<string, LearningPathItem[]>()
  }

  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathItemRow>(
    supabase,
    'learning_path_items',
  )
    .select(LEARNING_PATH_ITEM_SELECT)
    .in('learning_path_id', pathIds)
    .order('position', { ascending: true })

  if (error) {
    logger.error('Error loading learning path items:', error)
    throw new Error('No se pudieron cargar los items del learning path')
  }

  const itemsByPathId = new Map<string, LearningPathItem[]>()

  for (const row of data || []) {
    const existing = itemsByPathId.get(row.learning_path_id) || []
    existing.push(...mapLearningPathItems([row]))
    itemsByPathId.set(row.learning_path_id, existing)
  }

  return itemsByPathId
}
