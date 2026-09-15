import { createAdminClient } from '../../../../lib/supabase/admin'
import type { AdminWorkshop } from './workshops-transform.service'
import { enrichWorkshopRows } from './workshops-enrichment.service'
import { COURSE_WORKSHOP_SELECT } from './workshops-query.selects'
import type { CourseWorkshopRow } from './workshops-query.types'

export async function getAllWorkshops(): Promise<AdminWorkshop[]> {
  // Ver comentario en workshops-page-query.service.ts: courses requiere el
  // cliente de service role para el catalogo de super-admin desde el
  // lockdown 20260827120000.
  const supabase = createAdminClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select(COURSE_WORKSHOP_SELECT)
    .order('created_at', { ascending: false })
    .returns<CourseWorkshopRow[]>()

  if (error) throw error
  if (!courses || courses.length === 0) return []

  return enrichWorkshopRows(supabase, courses)
}
