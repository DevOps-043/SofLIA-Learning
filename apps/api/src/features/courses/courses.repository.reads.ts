import { DatabaseError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import { mapCourse, type CourseSelectRow } from './courses.mappers'
import { COURSE_SELECT_FIELDS } from './courses.select'
import type { NormalizedCourseListQuery } from './courses.types'

export async function findCourses(query: NormalizedCourseListQuery) {
  const supabase = getServiceClient()
  let coursesQuery = supabase
    .from('courses')
    .select(COURSE_SELECT_FIELDS, { count: 'exact' })
    .eq('is_active', query.isActive)

  if (query.category) coursesQuery = coursesQuery.eq('category', query.category)
  if (query.level) coursesQuery = coursesQuery.eq('level', query.level)
  if (query.search) coursesQuery = coursesQuery.ilike('title', `%${query.search}%`)

  const { data, error, count } = await coursesQuery
    .order(query.orderBy, { ascending: query.orderDirection === 'asc' })
    .range(query.offset, query.offset + query.limit - 1)

  if (error) {
    logger.error('Error fetching courses', { error: error.message })
    throw new DatabaseError('Error al obtener cursos')
  }

  return {
    courses: (data ?? []).map((course) => mapCourse(course as CourseSelectRow)),
    total: count ?? 0,
  }
}

export async function findCourseBySlug(slug: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT_FIELDS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new NotFoundError(`Curso no encontrado: ${slug}`)
  }

  return mapCourse(data as CourseSelectRow)
}
