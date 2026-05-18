import type { PlatformContext } from './context.types'
import type { PlatformSupabaseClient } from './client.types'

export async function applyPlatformCounts(
  supabase: PlatformSupabaseClient,
  context: PlatformContext,
): Promise<void> {
  const [{ count: coursesCount }, { count: usersCount }, { count: orgsCount }] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
  ])

  context.totalCourses = coursesCount || 0
  context.totalUsers = usersCount || 0
  context.totalOrganizations = orgsCount || 0
}
