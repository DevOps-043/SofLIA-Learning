import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { LEARNING_PATH_SELECT } from './selects'
import type { LearningPathRow } from './learning-path-row.types'

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
