import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPath, LearningPathUpsertPayload } from '../../types'
import { normalizeSlug } from './errors'
import { ensureUniqueSlug, getLearningPathById } from './learning-paths.query'
import type { LearningPathRow } from './rows'

export async function updateLearningPath(
  id: string,
  payload: Partial<LearningPathUpsertPayload>,
): Promise<LearningPath> {
  const existing = await getLearningPathById(id)
  if (!existing) {
    throw new Error('Learning path no encontrado')
  }

  const nextTitle = payload.title?.trim() || existing.title
  const nextSlug = normalizeSlug(payload.slug ?? existing.slug ?? nextTitle)
  await ensureUniqueSlug(nextSlug, id)

  const supabase = createAdminClient()
  const { error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .update({
      title: nextTitle,
      slug: nextSlug,
      description: payload.description !== undefined ? payload.description?.trim() || null : existing.description,
      is_active: payload.is_active ?? existing.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    logger.error('Error updating learning path:', error)
    throw new Error('No se pudo actualizar el learning path')
  }

  const refreshed = await getLearningPathById(id)
  if (!refreshed) {
    throw new Error('No se pudo recargar el learning path actualizado')
  }

  return refreshed
}
