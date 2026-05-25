import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

export async function fetchAdminUserStatsRows(activeSinceIso: string) {
  const client = getServiceClient()
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    verifiedUsers,
    roles,
    organizations,
  ] = await Promise.all([
    client.from('users').select('id', { count: 'exact', head: true }),
    client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_banned', false)
      .gte('last_login_at', activeSinceIso),
    client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_banned', true),
    client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('email_verified', true),
    client.from('users').select('cargo_rol'),
    client
      .from('organization_users')
      .select('organization_id, user_id, role, status, organizations(name, slug)')
      .eq('status', 'active'),
  ])

  assertQuery(totalUsers, 'Error al contar el total de usuarios')
  assertQuery(activeUsers, 'Error al contar los usuarios activos')
  assertQuery(bannedUsers, 'Error al contar los usuarios bloqueados')
  assertQuery(verifiedUsers, 'Error al contar los usuarios verificados')
  assertQuery(roles, 'Error al obtener la distribucion de roles')
  assertQuery(organizations, 'Error al obtener la distribucion por organizacion')

  return { totalUsers, activeUsers, bannedUsers, verifiedUsers, roles, organizations }
}

function assertQuery(result: { error: unknown | null }, message: string) {
  if (result.error) {
    throw new DatabaseError(message, result.error)
  }
}
