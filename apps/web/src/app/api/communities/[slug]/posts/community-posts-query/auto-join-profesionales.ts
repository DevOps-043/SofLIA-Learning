import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export async function autoJoinProfesionales(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const { data: allMemberships } = await supabase
    .from('community_members')
    .select('community_id, communities!inner(slug)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('communities.slug', 'profesionales')

  if (allMemberships && allMemberships.length > 0) return null

  const { data: newMembership, error: joinError } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
      is_active: true,
    })
    .select('id')
    .single()

  if (joinError || !newMembership) {
    logger.error('Error creating auto-membership:', joinError)
    return null
  }

  await incrementMemberCount(supabase, communityId)
  return newMembership
}

async function incrementMemberCount(supabase: SupabaseClient, communityId: string) {
  const { data: communityData } = await supabase
    .from('communities')
    .select('member_count')
    .eq('id', communityId)
    .single()

  if (!communityData) return

  await supabase
    .from('communities')
    .update({
      member_count: (communityData.member_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', communityId)
}
