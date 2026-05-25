import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath, LearningPathUpsertPayload } from '../../types'
import {
  buildLearningPathMutationErrorMessage,
  normalizeSlug,
} from './errors'
import { ensureUniqueSlug } from './learning-paths.query'
import type { LearningPathRow } from './rows'

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
    .select('id, title, slug, description, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    logger.error('Error creating learning path:', error)
    throw new Error(buildLearningPathMutationErrorMessage(error, 'No se pudo crear el learning path'))
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
