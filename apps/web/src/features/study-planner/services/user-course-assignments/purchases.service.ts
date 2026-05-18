import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import type { B2CCoursePurchase } from '../../types/user-context.types'
import { COURSE_INFO_SELECT } from '../course-query.shared'
import { buildCoursePurchase } from './mappers'
import {
  coursePurchasesTable,
  enrollmentProgressTable,
} from './tables'
import type { EnrollmentProgressRow } from './types'

export async function getB2CCoursePurchases(
  userId: string,
): Promise<B2CCoursePurchase[]> {
  const supabase = await createClient()

  const { data, error } = await coursePurchasesTable(supabase)
    .select(`
      purchase_id,
      user_id,
      course_id,
      purchased_at,
      access_status,
      expires_at,
      courses:course_id (
        ${COURSE_INFO_SELECT}
      )
    `)
    .eq('user_id', userId)
    .eq('access_status', 'active')

  if (error) {
    techDebtLogger.error('Error obteniendo compras de cursos B2C:', error)
    return []
  }

  const courseIds = Array.from(
    new Set((data ?? []).map((item) => item.course_id)),
  )
  const enrollments = await getEnrollmentProgressRows(supabase, userId, courseIds)
  const progressByCourseId = new Map(
    enrollments.map((enrollment) => [
      enrollment.course_id,
      enrollment.progress_percentage ?? 0,
    ]),
  )

  return (data ?? [])
    .map((item) =>
      buildCoursePurchase(item, progressByCourseId.get(item.course_id) ?? 0),
    )
    .filter((purchase): purchase is B2CCoursePurchase => Boolean(purchase))
}

async function getEnrollmentProgressRows(
  supabase: unknown,
  userId: string,
  courseIds: string[],
): Promise<EnrollmentProgressRow[]> {
  if (courseIds.length === 0) {
    return []
  }

  const { data: enrollmentRows } = await enrollmentProgressTable(supabase)
    .select('course_id, progress_percentage')
    .eq('user_id', userId)
    .in('course_id', courseIds)

  return enrollmentRows ?? []
}
