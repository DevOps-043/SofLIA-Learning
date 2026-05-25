import { createClient } from '../../../../lib/supabase/server'
import type {
  AdminWorkshopListFilters,
  AdminWorkshopListResult,
} from './workshops-transform.service'
import { enrichWorkshopRows } from './workshops-enrichment.service'
import {
  getPaginationBounds,
  normalizeSearchTerm,
} from './workshops-query.helpers'
import { COURSE_WORKSHOP_SELECT } from './workshops-query.selects'
import type { CourseWorkshopRow } from './workshops-query.types'

export async function getWorkshopsPage(
  filters: AdminWorkshopListFilters,
): Promise<AdminWorkshopListResult> {
  const supabase = await createClient()
  const { safePage, safeLimit, from, to } = getPaginationBounds(filters.page, filters.limit)
  const searchTerm = normalizeSearchTerm(filters.search)
  const category = filters.category?.trim()
  const instructorIds = await findMatchingInstructorIds(supabase, searchTerm)

  let query = supabase
    .from('courses')
    .select(COURSE_WORKSHOP_SELECT, { count: 'exact' })
    .or('approval_status.eq.approved,approval_status.is.null')

  if (searchTerm) {
    const searchFilters = [
      `title.ilike.%${searchTerm}%`,
      `description.ilike.%${searchTerm}%`,
      `category.ilike.%${searchTerm}%`,
    ]
    if (instructorIds.length > 0) {
      searchFilters.push(`instructor_id.in.(${instructorIds.join(',')})`)
    }
    query = query.or(searchFilters.join(','))
  }

  if (category && category !== 'all') query = query.ilike('category', category)
  if (filters.status === 'active') query = query.eq('is_active', true)
  if (filters.status === 'inactive') query = query.eq('is_active', false)

  const { data: courses, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .returns<CourseWorkshopRow[]>()

  if (error) throw error

  const pagination = {
    page: safePage,
    limit: safeLimit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / safeLimit),
  }

  if (!courses || courses.length === 0) {
    return { workshops: [], pagination }
  }

  return {
    workshops: await enrichWorkshopRows(supabase, courses),
    pagination,
  }
}

async function findMatchingInstructorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchTerm: string,
) {
  if (!searchTerm) return []

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .or(`display_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .limit(50)

  if (error) throw error
  return (data || []).map((instructor) => instructor.id)
}
