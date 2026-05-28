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
