import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathItem } from '../../types'
import { mapLearningPathItems } from './learning-path-mappers'
import type { LearningPathItemRow } from './learning-path-row.types'
import { syncNewCourseAccessForExistingLearningPathAssignments } from './new-course-access-sync.service'
import { getLearningPathById } from './read-learning-paths.service'
import { LEARNING_PATH_ITEM_SELECT } from './selects'

export async function addLearningPathItem(
  learningPathId: string,
  courseId: string,
  adminUserId: string,
): Promise<LearningPathItem> {
  const currentPath = await getLearningPathById(learningPathId)
  if (!currentPath) {
    throw new Error('Learning path no encontrado')
  }

  if (currentPath.items.some((item) => item.course_id === courseId)) {
    throw new Error('Ese taller ya existe dentro del learning path')
  }

  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathItemRow>(
    supabase,
    'learning_path_items',
  )
    .insert({
      learning_path_id: learningPathId,
      course_id: courseId,
      position: currentPath.items.length + 1,
    })
    .select(LEARNING_PATH_ITEM_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error adding learning path item:', error)
    throw new Error('No se pudo agregar el taller al learning path')
  }

  await syncNewCourseAccessForExistingLearningPathAssignments(
    learningPathId,
    courseId,
    adminUserId,
  )

  return mapLearningPathItems([data])[0]
}
