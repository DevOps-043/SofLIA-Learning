import { SupabaseClient } from '@supabase/supabase-js'
import { CommunityMemberRow, CommunityUserRow } from './types'

export async function loadCommunityMembers(
  supabase: SupabaseClient,
  communityId: string,
): Promise<CommunityMemberRow[]> {
  const joinedMembers = await loadMembersWithJoin(supabase, communityId)
  if (joinedMembers) return joinedMembers
  return loadMembersWithSeparateUsers(supabase, communityId)
}

async function loadMembersWithJoin(supabase: SupabaseClient, communityId: string) {
  const { data, error } = await supabase
    .from('community_members')
    .select(
      `
        id, role, joined_at, user_id,
        users!inner (
          id, email, first_name, last_name, username, profile_picture_url,
          linkedin_url, github_url, website_url, bio, location, created_at, points, profile_visibility
        )
      `,
    )
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  return error ? null : ((data as CommunityMemberRow[]) ?? [])
}

async function loadMembersWithSeparateUsers(supabase: SupabaseClient, communityId: string) {
  const { data: membersData } = await supabase
    .from('community_members')
    .select('id, role, joined_at, user_id')
    .eq('community_id', communityId)
    .eq('is_active', true)

  if (!membersData || membersData.length === 0) return []

  const userIds = membersData.map((member) => member.user_id)
  const { data: usersData } = await supabase
    .from('users')
    .select(
      'id, email, first_name, last_name, username, profile_picture_url, linkedin_url, github_url, website_url, bio, location, created_at, points, profile_visibility',
    )
    .in('id', userIds)

  return membersData.map((member) => ({
    ...member,
    users: findUserOrFallback(usersData as CommunityUserRow[] | null, member.user_id),
  })) as CommunityMemberRow[]
}

function findUserOrFallback(users: CommunityUserRow[] | null, userId: string): CommunityUserRow {
  return (
    users?.find((user) => user.id === userId) ?? {
      id: userId,
      email: 'usuario@ejemplo.com',
      first_name: 'Usuario',
      last_name: 'Sin nombre',
      username: 'usuario',
      profile_picture_url: null,
      linkedin_url: null,
      github_url: null,
      website_url: null,
      bio: null,
      location: null,
      created_at: new Date().toISOString(),
      points: 0,
      profile_visibility: 'public',
    }
  )
}
