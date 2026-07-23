import 'server-only'

import {
  formatSegmentsForPrompt,
  parseTranscriptSegments,
} from '@/lib/course-content/transcript-segments'
import { logger } from '@/lib/utils/logger'
import { createAdminClient } from '@/lib/supabase/admin'

import type { CourseLessonTranscriptContext } from './lesson-context.types'

/**
 * Carga las transcripciones del curso para el contexto de SofLIA.
 *
 * MOTIVO: al prompt solo llegaba la lección abierta, así que una pregunta sobre
 * el vídeo de una lección anterior no tenía forma de responderse.
 *
 * PRESUPUESTO: se inyectan todas las lecciones del curso, pero acotadas por un
 * tope global de caracteres. Sin ese tope, un curso largo produce un prompt que
 * supera el límite del modelo: la petición falla con 400 y SofLIA deja de
 * responder POR COMPLETO, que es peor que entregar el material recortado.
 */

/** Tope global del bloque de otras lecciones (~40k caracteres ≈ 10k tokens). */
const TOTAL_OTHER_LESSONS_BUDGET = 40_000

/** Tope por lección, para que una sola no consuma todo el presupuesto. */
const PER_LESSON_BUDGET = 6_000

/** Cota defensiva de lecciones a cargar de un mismo curso. */
const MAX_LESSONS = 60

interface CourseLessonRow {
  lesson_id: string
  lesson_title: string | null
  lesson_order_index: number | null
  summary_content: string | null
  transcript_content: string | null
  transcript_segments: unknown
  course_modules: { module_title: string | null; module_order: number | null } | null
}

/**
 * Devuelve las transcripciones del curso EXCLUYENDO la lección actual (esa ya
 * viaja completa y con prioridad en su propia sección del prompt).
 */
export async function loadCourseLessonTranscripts(params: {
  courseId: string
  currentLessonId?: string
}): Promise<CourseLessonTranscriptContext[]> {
  const { courseId, currentLessonId } = params
  if (!courseId) return []

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('course_lessons')
      .select(
        'lesson_id, lesson_title, lesson_order_index, summary_content, transcript_content, transcript_segments, course_modules!inner(module_title, module_order, course_id)',
      )
      .eq('course_modules.course_id', courseId)
      .eq('is_published', true)
      .order('lesson_order_index', { ascending: true })
      .limit(MAX_LESSONS)

    if (error) {
      logger.warn('No se pudieron cargar las transcripciones del curso', {
        courseId,
        error: error.message,
      })
      return []
    }

    return buildContextFromRows(
      (data ?? []) as unknown as CourseLessonRow[],
      currentLessonId,
    )
  } catch (error) {
    // El contexto extra es una mejora, nunca un requisito: si falla, SofLIA
    // sigue respondiendo con la lección actual.
    logger.warn('Fallo inesperado cargando transcripciones del curso', {
      courseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

/**
 * Transcripción con marcas de tiempo de UNA lección concreta (la que se está
 * viendo). Se resuelve en servidor porque el contexto que envía el cliente trae
 * la transcripción como texto plano, sin segmentos.
 */
export async function loadLessonTranscriptWithTimecodes(
  lessonId: string,
  maxChars: number,
): Promise<{ transcriptWithTimecodes: string; hasTimecodes: boolean } | null> {
  if (!lessonId) return null

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('course_lessons')
      .select('transcript_segments')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error || !data) return null

    const segments = parseTranscriptSegments(data.transcript_segments)
    if (segments.length === 0) return null

    return {
      hasTimecodes: true,
      transcriptWithTimecodes: formatSegmentsForPrompt(segments, maxChars),
    }
  } catch (error) {
    logger.warn('No se pudo cargar la transcripcion con marcas de tiempo', {
      error: error instanceof Error ? error.message : 'unknown',
      lessonId,
    })
    return null
  }
}

function buildContextFromRows(
  rows: CourseLessonRow[],
  currentLessonId?: string,
): CourseLessonTranscriptContext[] {
  const lessons: CourseLessonTranscriptContext[] = []
  let remainingBudget = TOTAL_OTHER_LESSONS_BUDGET

  for (const row of rows) {
    if (currentLessonId && row.lesson_id === currentLessonId) continue
    if (remainingBudget <= 0) break

    const segments = parseTranscriptSegments(row.transcript_segments)
    const perLessonBudget = Math.min(PER_LESSON_BUDGET, remainingBudget)

    // Con segmentos se envía la versión con marcas de tiempo; sin ellos, el texto
    // plano recortado, avisando de que no se pueden citar minutos.
    const transcriptWithTimecodes =
      segments.length > 0
        ? formatSegmentsForPrompt(segments, perLessonBudget)
        : row.transcript_content?.slice(0, perLessonBudget) || null

    if (!transcriptWithTimecodes && !row.summary_content) continue

    lessons.push({
      hasTimecodes: segments.length > 0,
      lessonId: row.lesson_id,
      lessonOrder: row.lesson_order_index ?? undefined,
      lessonTitle: row.lesson_title ?? undefined,
      moduleTitle: row.course_modules?.module_title ?? undefined,
      summary: row.summary_content,
      transcriptWithTimecodes,
    })

    remainingBudget -= transcriptWithTimecodes?.length ?? 0
  }

  return lessons
}
