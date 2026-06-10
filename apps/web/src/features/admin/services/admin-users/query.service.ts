import { createAdminClient } from './client'
import {
  ADMIN_USER_LIST_SELECT_FIELDS,
  mapAdminUserWithAge,
  normalizeUsersPagination,
} from './helpers'
import type { GetUsersOptions, GetUsersResult, UserStats } from './types'
import { resolveFilteredUserIds } from './user-filter.service'

export async function getAdminUsers(
  options: GetUsersOptions = {},
): Promise<GetUsersResult> {
  const supabase = createAdminClient()
  const { page, limit, from, to, search } = normalizeUsersPagination(options)

  const filteredUserIds = await resolveFilteredUserIds(supabase, {
    organizationId: options.organizationId,
    courseId: options.courseId,
    learningPathId: options.learningPathId,
  })

  // Hay filtros activos pero ningún usuario coincide: evita un full scan.
  if (filteredUserIds !== null && filteredUserIds.length === 0) {
    return { users: [], total: 0, page, totalPages: 0 }
  }

  let query = supabase
    .from('users')
    .select(ADMIN_USER_LIST_SELECT_FIELDS, { count: 'exact' })

  if (filteredUserIds !== null) {
    query = query.in('id', filteredUserIds)
  }

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%`,
    )
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw error
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    users: ((data || []) as GetUsersResult['users']).map(mapAdminUserWithAge),
    total,
    page,
    totalPages,
  }
}

export async function getAdminUserStats(): Promise<UserStats> {
  const supabase = createAdminClient()

  const [totalResult, verifiedResult, instructorsResult, adminsResult] =
    await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('email_verified', true),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('cargo_rol', 'Instructor'),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('cargo_rol', 'Administrador'),
    ])

  if (totalResult.error) throw totalResult.error
  if (verifiedResult.error) throw verifiedResult.error
  if (instructorsResult.error) throw instructorsResult.error
  if (adminsResult.error) throw adminsResult.error

  return {
    totalUsers: totalResult.count || 0,
    verifiedUsers: verifiedResult.count || 0,
    instructors: instructorsResult.count || 0,
    administrators: adminsResult.count || 0,
  }
}
