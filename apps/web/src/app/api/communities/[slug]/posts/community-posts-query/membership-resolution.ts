import { SupabaseClient } from '@supabase/supabase-js';
import { PROFESIONALES_COMMUNITY_SLUG } from '../../../community-policy.constants';
import { autoJoinProfesionales } from './profesionales-auto-join';
import { CommunityMembership } from './types';

export async function resolveMembership(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
  userEmail: string | undefined,
  slug: string
): Promise<CommunityMembership | null> {
  const directMembership = await findMembershipByUserId(supabase, communityId, userId);
  if (directMembership) return directMembership;

  const emailMembership = await findMembershipByEmail(supabase, communityId, userEmail);
  if (emailMembership) return emailMembership;

  return slug === PROFESIONALES_COMMUNITY_SLUG
    ? autoJoinProfesionales(supabase, communityId, userId)
    : null;
}

async function findMembershipByUserId(
  supabase: SupabaseClient,
  communityId: string,
  userId: string
) {
  const { data } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  return (data as CommunityMembership | null) ?? null;
}

async function findMembershipByEmail(
  supabase: SupabaseClient,
  communityId: string,
  userEmail?: string
) {
  if (!userEmail) return null;
  const { data: userByEmail } = await supabase.from('users').select('id').eq('email', userEmail).single();
  if (!userByEmail?.id) return null;
  return findMembershipByUserId(supabase, communityId, userByEmail.id as string);
}
