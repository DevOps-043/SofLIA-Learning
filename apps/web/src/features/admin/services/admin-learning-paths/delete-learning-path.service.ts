import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathRow } from './learning-path-row.types'

export async function deleteLearningPath(id: string) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<LearningPathRow>(supabase, 'learning_paths')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Error deleting learning path:', error)
    throw new Error('No se pudo eliminar el learning path')
  }
}
