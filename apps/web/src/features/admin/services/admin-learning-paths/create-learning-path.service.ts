import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath, LearningPathUpsertPayload } from '../../types'
import { buildLearningPathMutationErrorMessage, normalizeSlug } from './learning-path-errors'
import type { LearningPathRow } from './learning-path-row.types'
import { ensureUniqueSlug } from './slug.service'
import { LEARNING_PATH_SELECT } from './selects'

export async function createLearningPath(
  payload: LearningPathUpsertPayload,
  adminUserId: string,
): Promise<LearningPath> {
  const title = payload.title?.trim()

  if (!title) {
    throw new Error('El titulo del learning path es requerido')
  }

  const slug = normalizeSlug(payload.slug || title)
  await ensureUniqueSlug(slug)

  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .insert({
      title,
      slug,
      description: payload.description?.trim() || null,
      is_active: payload.is_active ?? true,
      created_by: adminUserId,
    })
    .select(LEARNING_PATH_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error creating learning path:', error)
    throw new Error(
      buildLearningPathMutationErrorMessage(error, 'No se pudo crear el learning path'),
    )
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    is_active: Boolean(data.is_active),
    created_at: data.created_at,
    updated_at: data.updated_at,
    items: [],
    item_count: 0,
  }
}
