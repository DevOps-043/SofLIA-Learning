import { createAdminClient } from '../calendar.service'
import type {
  LessonMetadataRow,
  OrderValidationResult,
  PendingLessonRef,
} from './lesson-order.types'
import {
  buildMetadataByLessonId,
  loadModuleMetadata,
} from './lesson-order.metadata-builders'
import { buildValidationFailureResult } from './lesson-order.validation'

export async function loadLessonMetadata(lessonIds: string[]): Promise<
  | { valid: true; metadata: Map<string, PendingLessonRef> }
  | OrderValidationResult
> {
  if (lessonIds.length === 0) return { valid: true, metadata: new Map() }

  const supabase = createAdminClient()
  const { data: lessonRows, error: lessonError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_order_index, module_id')
    .in('lesson_id', lessonIds)

  if (lessonError || !lessonRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque falt\u00f3 metadata de lecciones.',
    )
  }

  const moduleMetadataResult = await loadModuleMetadata(
    Array.from(new Set(lessonRows.map((row) => row.module_id).filter(Boolean))),
  )
  if (!moduleMetadataResult.valid) return moduleMetadataResult

  return buildMetadataByLessonId(
    lessonRows as LessonMetadataRow[],
    moduleMetadataResult.moduleById,
  )
}

export async function loadCompletedLessonIds(
  userId: string,
  lessonIds: string[],
): Promise<
  | { valid: true; completedLessonIds: Set<string> }
  | OrderValidationResult
> {
  if (lessonIds.length === 0) {
    return { valid: true, completedLessonIds: new Set() }
  }

  const supabase = createAdminClient()
  const { data: progressRows, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  if (error || !progressRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque no fue posible consultar el progreso del usuario.',
    )
  }

  return {
    valid: true,
    completedLessonIds: new Set(
      progressRows
        .filter((row) => Boolean(row.is_completed))
        .map((row) => row.lesson_id),
    ),
  }
}
