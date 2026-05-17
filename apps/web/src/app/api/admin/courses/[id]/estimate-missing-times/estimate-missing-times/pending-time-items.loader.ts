import { NextResponse } from 'next/server'
import { pendingItemsLoadErrorResponse } from './estimation-responses'
import type {
  EstimateSupabaseClient,
  LessonActivityInfo,
  LessonMaterialInfo,
  PendingTimeItems,
} from './estimation.types'

export async function loadPendingTimeItems(
  supabase: EstimateSupabaseClient,
  lessonIds: string[],
): Promise<PendingTimeItems | NextResponse> {
  const [{ data: materials, error: materialsError }, { data: activities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from('lesson_materials')
        .select(
          'material_id, lesson_id, material_title, material_description, material_type, content_data, external_url, file_url, estimated_time_minutes',
        )
        .in('lesson_id', lessonIds)
        .is('estimated_time_minutes', null),
      supabase
        .from('lesson_activities')
        .select(
          'activity_id, lesson_id, activity_title, activity_description, activity_type, activity_content, activity_config, ai_prompts, requires_soflia_validation, estimated_time_minutes',
        )
        .in('lesson_id', lessonIds)
        .is('estimated_time_minutes', null),
    ])

  if (materialsError || activitiesError) return pendingItemsLoadErrorResponse()

  return {
    materials: (materials || []) as LessonMaterialInfo[],
    activities: (activities || []) as LessonActivityInfo[],
  }
}
