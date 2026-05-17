import { createClient } from '../../../../lib/supabase/server'
import type { AdminWorkshop } from './workshops-transform.service'
import { enrichWorkshopRows } from './workshops-enrichment.service'
import { COURSE_WORKSHOP_SELECT } from './workshops-query.selects'
import type { CourseWorkshopRow } from './workshops-query.types'

export async function getAllWorkshops(): Promise<AdminWorkshop[]> {
  const supabase = await createClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select(COURSE_WORKSHOP_SELECT)
    .order('created_at', { ascending: false })
    .returns<CourseWorkshopRow[]>()

  if (error) throw error
  if (!courses || courses.length === 0) return []

  return enrichWorkshopRows(supabase, courses)
}
