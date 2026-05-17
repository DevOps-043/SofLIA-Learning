import { createAdminClient } from '../calendar.service'
import type {
  LessonMetadataRow,
  ModuleMetadataRow,
  OrderValidationResult,
  PendingLessonRef,
} from './lesson-order.types'
import { buildValidationFailureResult } from './lesson-order.validation'

export async function loadModuleMetadata(moduleIds: string[]): Promise<
  | { valid: true; moduleById: Map<string, ModuleMetadataRow> }
  | OrderValidationResult
> {
  const supabase = createAdminClient()
  const { data: moduleRows, error: moduleError } = moduleIds.length === 0
    ? { data: [] as ModuleMetadataRow[], error: null }
    : await supabase
      .from('course_modules')
      .select('module_id, module_order_index, course_id')
      .in('module_id', moduleIds)

  if (moduleError || !moduleRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque falt\u00f3 metadata de m\u00f3dulos.',
    )
  }

  const moduleById = new Map<string, ModuleMetadataRow>()
  for (const row of moduleRows as ModuleMetadataRow[]) {
    moduleById.set(row.module_id, row)
  }

  return { valid: true, moduleById }
}

export function buildMetadataByLessonId(
  lessonRows: LessonMetadataRow[],
  moduleById: Map<string, ModuleMetadataRow>,
) {
  const metadataByLessonId = new Map<string, PendingLessonRef>()

  for (const row of lessonRows) {
    const module = moduleById.get(row.module_id)
    if (!module) {
      return buildValidationFailureResult(
        'No pude validar el orden de lecciones porque algunas lecciones no tienen m\u00f3dulo asociado.',
      )
    }

    metadataByLessonId.set(row.lesson_id, {
      courseId: module.course_id,
      lessonId: row.lesson_id,
      moduleOrderIndex: module.module_order_index,
      lessonOrderIndex: row.lesson_order_index,
    })
  }

  return { valid: true as const, metadata: metadataByLessonId }
}
