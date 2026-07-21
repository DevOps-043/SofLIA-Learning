import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { createAdminClient } from '@/lib/supabase/admin'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import {
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from '@/lib/course-content'
import {
  resolveCourseLessonByLanguage,
  type TranslationContext,
} from '@/app/api/courses/_services/lesson-language-resolution.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createSupabaseClient>>
  | ReturnType<typeof createAdminClient>

export interface LessonDataResult {
  lesson_id: string
  transcript: string | null
  summary: string | null
  activities: unknown[]
  materials: unknown[]
  translationContext: TranslationContext
}

export async function loadLessonData(
  supabase: SupabaseServerClient,
  courseId: string,
  lessonId: string,
  language: string,
): Promise<LessonDataResult | null> {
  const resolvedLesson = await resolveCourseLessonByLanguage({
    supabase,
    courseId,
    lessonId,
    requestedLanguage: language,
  })

  if (!resolvedLesson.lesson || !resolvedLesson.baseLessonId) {
    return null
  }

  const [activitiesResult, materialsResult] = await Promise.all([
    supabase
      .from('lesson_activities')
      .select(SELECT_COLUMNS.lesson_activities)
      .eq('lesson_id', resolvedLesson.baseLessonId)
      .order('activity_order_index', { ascending: true }),
    supabase
      .from('lesson_materials')
      .select(SELECT_COLUMNS.lesson_materials)
      .eq('lesson_id', resolvedLesson.baseLessonId)
      .order('material_order_index', { ascending: true }),
  ])

  const missingPieces = [...resolvedLesson.translationContext.missingPieces]
  if (resolvedLesson.translationContext.usedFallback && (activitiesResult.data || []).length === 0) {
    missingPieces.push('activities')
  }
  if (resolvedLesson.translationContext.usedFallback && (materialsResult.data || []).length === 0) {
    missingPieces.push('materials')
  }

  // SEGURIDAD: normalizamos para el cliente en el borde de salida. Además de
  // unificar la forma del contenido con los demás endpoints de aprendizaje, esto
  // elimina la clave de respuestas del quiz (`correctAnswer`) del payload.
  const activities = (activitiesResult.data || []).map((activity) =>
    normalizeLessonActivityRecord(activity as Record<string, unknown>),
  )
  const materials = (materialsResult.data || []).map((material) =>
    normalizeLessonMaterialRecord(material as Record<string, unknown>),
  )

  return {
    lesson_id: resolvedLesson.baseLessonId,
    transcript: resolvedLesson.lesson.transcript_content || null,
    summary: resolvedLesson.lesson.summary_content || null,
    activities,
    materials,
    translationContext: {
      ...resolvedLesson.translationContext,
      usedFallback:
        resolvedLesson.translationContext.usedFallback ||
        missingPieces.length > resolvedLesson.translationContext.missingPieces.length,
      missingPieces: [...new Set(missingPieces)],
    },
  }
}
