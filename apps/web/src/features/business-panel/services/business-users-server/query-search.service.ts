import type { BusinessUsersAdminClient } from './client'

export async function findMatchingUserIds(
  supabase: BusinessUsersAdminClient,
  search: string | undefined,
) {
  const normalizedSearch = search?.trim()

  if (!normalizedSearch) {
    return null
  }

  const escapedSearch = normalizedSearch.replace(/[%_]/g, '\\$&')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .or(
      [
        `email.ilike.%${escapedSearch}%`,
        `username.ilike.%${escapedSearch}%`,
        `first_name.ilike.%${escapedSearch}%`,
        `last_name.ilike.%${escapedSearch}%`,
        `display_name.ilike.%${escapedSearch}%`,
      ].join(','),
    )
    .limit(500)

  if (usersError) {
    throw usersError
  }

  return (users ?? []).map((user) => user.id)
}
