import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_LESSON_SELECT_FIELDS,
  enrichLessonWithInstructorName,
  fetchInstructorNameMap,
  normalizeDirectVideoProviderId,
} from './shared'
import {
  recalculateAllLessonDurations,
  updateModuleDuration,
} from './duration.service'
import type {
  AdminLesson,
  CreateLessonData,
  UpdateLessonData,
} from './types'

export async function createLesson(
  moduleId: string,
  lessonData: CreateLessonData,
  userId?: string,
): Promise<AdminLesson> {
  const supabase = await createClient()

  if (!lessonData.duration_seconds || lessonData.duration_seconds <= 0) {
    throw new Error(
      'La duración debe ser mayor a 0 segundos. Por favor, ingrese una duración válida.',
    )
  }

  const { count } = await supabase
    .from('course_lessons')
    .select('lesson_id', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      module_id: moduleId,
      lesson_title: lessonData.lesson_title,
      lesson_description: lessonData.lesson_description,
      lesson_order_index: (count || 0) + 1,
      video_provider_id: normalizeDirectVideoProviderId(
        lessonData.video_provider_id,
        lessonData.video_provider,
      ),
      video_provider: lessonData.video_provider,
      duration_seconds: Math.max(1, Math.floor(lessonData.duration_seconds)),
      transcript_content: lessonData.transcript_content,
      summary_content: lessonData.summary_content,
      is_published: lessonData.is_published ?? false,
      instructor_id: lessonData.instructor_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  await updateModuleDuration(moduleId)

  try {
    const { translateLessonOnCreate } = await import(
      '@/core/services/courseTranslation.service'
    )
    await translateLessonOnCreate(
      data.lesson_id,
      {
        lesson_title: data.lesson_title,
        lesson_description: data.lesson_description,
        transcript_content: data.transcript_content,
        summary_content: data.summary_content,
      },
      userId,
    )
  } catch (translationError) {
    console.error(
      'Error en traducción automática de la lección:',
      translationError,
    )
  }

  return enrichSingleLesson(supabase, data as AdminLesson)
}

export async function updateLesson(
  lessonId: string,
  lessonData: UpdateLessonData,
): Promise<AdminLesson> {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (lessonData.lesson_title !== undefined) {
    updateData.lesson_title = lessonData.lesson_title
  }
  if (lessonData.lesson_description !== undefined) {
    updateData.lesson_description = lessonData.lesson_description
  }
  if (lessonData.video_provider_id !== undefined) {
    updateData.video_provider_id = normalizeDirectVideoProviderId(
      lessonData.video_provider_id,
      lessonData.video_provider || 'custom',
    )
  }
  if (lessonData.video_provider !== undefined) {
    updateData.video_provider = lessonData.video_provider
  }
  if (lessonData.duration_seconds !== undefined) {
    updateData.duration_seconds = Math.max(
      1,
      Math.floor(lessonData.duration_seconds),
    )
  }
  if (lessonData.transcript_content !== undefined) {
    updateData.transcript_content = lessonData.transcript_content
  }
  if (lessonData.summary_content !== undefined) {
    updateData.summary_content = lessonData.summary_content
  }
  if (lessonData.is_published !== undefined) {
    updateData.is_published = lessonData.is_published
  }
  if (lessonData.instructor_id !== undefined) {
    updateData.instructor_id = lessonData.instructor_id
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .update(updateData)
    .eq('lesson_id', lessonId)
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  const updatedLesson = data as AdminLesson
  if (updatedLesson.module_id) {
    await updateModuleDuration(updatedLesson.module_id)
  }

  return enrichSingleLesson(supabase, updatedLesson)
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const supabase = await createClient()

  // 1. Obtener info de la lección antes de borrar para actualizar duraciones después
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('module_id')
    .eq('lesson_id', lessonId)
    .single()

  // 2. Limpiar dependencias (en el orden correcto para evitar conflictos de FK)
  // Nota: Idealmente esto debería estar en la BD con ON DELETE CASCADE,
  // pero lo manejamos aquí programáticamente para asegurar que la eliminación funcione.

  // Actividades (tienen sus propias dependencias como lia_activity_completions)
  const { data: activities } = await supabase
    .from('lesson_activities')
    .select('activity_id')
    .eq('lesson_id', lessonId)

  if (activities && activities.length > 0) {
    const activityIds = activities.map((a) => a.activity_id)
    await supabase
      .from('lia_activity_completions')
      .delete()
      .in('activity_id', activityIds)
    await supabase
      .from('lia_common_questions')
      .delete()
      .in('activity_id', activityIds)
    await supabase.from('lesson_activities').delete().in('activity_id', activityIds)
  }

  // Conversaciones de LIA (tienen mensajes)
  const { data: convs } = await supabase
    .from('lia_conversations')
    .select('conversation_id')
    .eq('lesson_id', lessonId)

  if (convs && convs.length > 0) {
    const convIds = convs.map((c) => c.conversation_id)
    await supabase.from('lia_messages').delete().in('conversation_id', convIds)
    await supabase
      .from('lia_activity_completions')
      .delete()
      .in('conversation_id', convIds)
    await supabase.from('lia_conversations').delete().in('conversation_id', convIds)
  }

  // Resto de dependencias directas de la lección
  await Promise.all([
    supabase.from('lesson_materials').delete().eq('lesson_id', lessonId),
    supabase.from('lesson_checkpoints').delete().eq('lesson_id', lessonId),
    supabase.from('lesson_feedback').delete().eq('lesson_id', lessonId),
    supabase.from('lesson_tracking').delete().eq('lesson_id', lessonId),
    supabase.from('lesson_time_estimates').delete().eq('lesson_id', lessonId),
    supabase.from('lesson_chat_suggestions').delete().eq('lesson_id', lessonId),
    supabase.from('lia_common_questions').delete().eq('lesson_id', lessonId),
    supabase.from('study_sessions').delete().eq('lesson_id', lessonId),
    supabase.from('user_activity_log').delete().eq('lesson_id', lessonId),
    supabase.from('user_activity_submissions').delete().eq('lesson_id', lessonId),
    supabase.from('user_lesson_notes').delete().eq('lesson_id', lessonId),
    supabase.from('user_lesson_progress').delete().eq('lesson_id', lessonId),
    supabase.from('user_quiz_submissions').delete().eq('lesson_id', lessonId),
    // Limpiar traducciones (polimórficas)
    supabase
      .from('content_translations')
      .delete()
      .eq('entity_type', 'lesson')
      .eq('entity_id', lessonId),
  ])

  // 3. Finalmente borrar la lección de las tablas de lecciones (Español, Inglés, Portugués)
  const results = await Promise.all([
    supabase.from('course_lessons').delete().eq('lesson_id', lessonId),
    supabase.from('course_lessons_en').delete().eq('lesson_id', lessonId),
    supabase.from('course_lessons_pt').delete().eq('lesson_id', lessonId),
  ])

  const error = results.find((r) => r.error)?.error
  if (error) {
    throw error
  }

  // 4. Actualizar duración del módulo padre
  const moduleId = (lesson as { module_id?: string | null } | null)?.module_id
  if (moduleId) {
    await updateModuleDuration(moduleId)
  }
}

export async function reorderLessons(
  lessons: Array<{ lesson_id: string; lesson_order_index: number }>,
): Promise<void> {
  const supabase = await createClient()

  const temporaryResults = await Promise.all(
    lessons.map((lesson) =>
      supabase
        .from('course_lessons')
        .update({
          lesson_order_index: lesson.lesson_order_index + 10000,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson.lesson_id),
    ),
  )

  const temporaryError = temporaryResults.find((result) => result.error)
  if (temporaryError?.error) {
    throw new Error(
      `Error al reordenar (fase 1): ${temporaryError.error.message}`,
    )
  }

  const finalResults = await Promise.all(
    lessons.map((lesson) =>
      supabase
        .from('course_lessons')
        .update({
          lesson_order_index: lesson.lesson_order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson.lesson_id),
    ),
  )

  const finalError = finalResults.find((result) => result.error)
  if (finalError?.error) {
    throw new Error(
      `Error al reordenar lecciones: ${finalError.error.message}`,
    )
  }
}

export async function toggleLessonPublished(
  lessonId: string,
): Promise<AdminLesson> {
  const supabase = await createClient()
  const { data: currentLesson } = await supabase
    .from('course_lessons')
    .select('is_published')
    .eq('lesson_id', lessonId)
    .single()

  if (!currentLesson) {
    throw new Error('Lección no encontrada')
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .update({
      is_published: !(currentLesson as { is_published: boolean }).is_published,
      updated_at: new Date().toISOString(),
    })
    .eq('lesson_id', lessonId)
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  return data as AdminLesson
}

export { recalculateAllLessonDurations }

async function enrichSingleLesson(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lesson: AdminLesson,
): Promise<AdminLesson> {
  const instructorNameMap = await fetchInstructorNameMap(
    supabase,
    lesson.instructor_id ? [lesson.instructor_id] : [],
  )

  return enrichLessonWithInstructorName(lesson, instructorNameMap)
}
