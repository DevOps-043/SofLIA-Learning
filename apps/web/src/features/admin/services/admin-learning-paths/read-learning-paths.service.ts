import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath } from '../../types'
import { loadItemsByPathIds } from './items-loader.service'
import { mapLearningPaths } from './learning-path-mappers'
import type { LearningPathRow } from './learning-path-row.types'
import { LEARNING_PATH_SELECT } from './selects'

export async function listLearningPaths(): Promise<LearningPath[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .select(LEARNING_PATH_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching learning paths:', error)
    throw new Error('No se pudieron cargar los learning paths')
  }

  const paths = data || []
  const itemsByPathId = await loadItemsByPathIds(paths.map((path) => path.id))
  return mapLearningPaths(paths, itemsByPathId)
}

export async function getLearningPathById(id: string): Promise<LearningPath | null> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .select(LEARNING_PATH_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    logger.error('Error fetching learning path by id:', error)
    throw new Error('No se pudo cargar el learning path')
  }

  if (!data) return null

  const itemsByPathId = await loadItemsByPathIds([id])
  return mapLearningPaths([data], itemsByPathId)[0] || null
}
