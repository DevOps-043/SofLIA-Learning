import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath } from '../../types'
import { mapLearningPaths } from './learning-path-mappers'
import { loadItemsByPathIds } from './learning-path-items.query'
import type { LearningPathRow } from './rows'

const LEARNING_PATH_SELECT = 'id, title, slug, description, is_active, created_at, updated_at'

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

export async function ensureUniqueSlug(slug: string | null, currentPathId?: string) {
  if (!slug) return

  const supabase = createAdminClient()
  let query = fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .select(LEARNING_PATH_SELECT)
    .eq('slug', slug)

  if (currentPathId) {
    query = query.neq('id', currentPathId)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Error validating learning path slug:', error)
    throw new Error('No se pudo validar el slug del learning path')
  }

  if ((data || []).length > 0) {
    throw new Error('Ya existe un learning path con ese slug')
  }
}
