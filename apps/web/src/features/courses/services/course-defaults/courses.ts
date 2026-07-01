import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { CourseReference } from './types'

interface CourseRow { id: string; title: string; is_active: boolean | null }

export async function getActiveCourseReference(courseId: string): Promise<CourseReference | null> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<CourseRow>(supabase, 'courses')
    .select('id, title, is_active')
    .eq('id', courseId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    logger.error('Error loading course for default rule validation:', error)
    return null
  }
  return data ? { id: data.id, title: data.title, is_active: Boolean(data.is_active) } : null
}

export async function loadCourseReferences(courseIds: string[]): Promise<Map<string, CourseReference>> {
  if (courseIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await fromLoose<CourseRow>(supabase, 'courses')
    .select('id, title, is_active')
    .in('id', courseIds)

  if (error) {
    logger.error('Error loading courses for default rules list:', error)
    return new Map()
  }

  return new Map(
    (data || []).map((row) => [row.id, { id: row.id, title: row.title, is_active: Boolean(row.is_active) }]),
  )
}
