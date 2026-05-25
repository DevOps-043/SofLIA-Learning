import type { SupabaseServerClient, UserProfileRow } from './types'

export async function loadUsersMap(
  supabase: SupabaseServerClient,
  userIds: string[],
): Promise<Map<string, UserProfileRow>> {
  if (userIds.length === 0) {
    return new Map<string, UserProfileRow>()
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, first_name, last_name, username, signature_name, signature_url')
    .in('id', userIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as UserProfileRow[]).map(user => [user.id, user]),
  )
}
