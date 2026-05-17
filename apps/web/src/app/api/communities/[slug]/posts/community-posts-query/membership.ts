import type { SupabaseClient } from '@supabase/supabase-js'
import { autoJoinProfesionales } from './auto-join-profesionales'

export async function resolveMembership(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
  userEmail: string | undefined,
  slug: string,
): Promise<{ id: string } | null> {
  const { data: directMembership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (directMembership) return directMembership

  const emailMembership = userEmail
    ? await findMembershipByEmail(supabase, communityId, userEmail)
    : null

  if (emailMembership) return emailMembership
  if (slug === 'profesionales') return autoJoinProfesionales(supabase, communityId, userId)

  return null
}

async function findMembershipByEmail(
  supabase: SupabaseClient,
  communityId: string,
  userEmail: string,
): Promise<{ id: string } | null> {
  const { data: userByEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single()

  if (!userByEmail) return null

  const { data: emailMembership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userByEmail.id)
    .eq('is_active', true)
    .single()

  return emailMembership || null
}
