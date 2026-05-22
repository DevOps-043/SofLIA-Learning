import { SELECT_COLUMNS } from '@/lib/supabase/select-types'

import type {
  LessonActivityRow,
  LessonMaterialRow,
  SidebarSupabaseClient,
} from './sidebar.types'

export function fetchActivities(supabase: SidebarSupabaseClient, lessonId: string) {
  return supabase
    .from('lesson_activities')
    .select(SELECT_COLUMNS.lesson_activities)
    .eq('lesson_id', lessonId)
    .order('activity_order_index', { ascending: true })
    .returns<LessonActivityRow[]>()
}

export function fetchMaterials(supabase: SidebarSupabaseClient, lessonId: string) {
  return supabase
    .from('lesson_materials')
    .select(SELECT_COLUMNS.lesson_materials)
    .eq('lesson_id', lessonId)
    .order('material_order_index', { ascending: true })
    .returns<LessonMaterialRow[]>()
}

export function fetchMaterialQuizzes(supabase: SidebarSupabaseClient, lessonId: string) {
  return supabase
    .from('lesson_materials')
    .select('material_id, material_title, material_type')
    .eq('lesson_id', lessonId)
    .eq('material_type', 'quiz')
    .returns<LessonMaterialRow[]>()
}

export function fetchActivityQuizzes(supabase: SidebarSupabaseClient, lessonId: string) {
  return supabase
    .from('lesson_activities')
    .select('activity_id, activity_title, activity_type, is_required')
    .eq('lesson_id', lessonId)
    .eq('activity_type', 'quiz')
    .eq('is_required', true)
    .returns<LessonActivityRow[]>()
}
