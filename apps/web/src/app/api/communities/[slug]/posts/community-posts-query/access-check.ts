import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { PROFESIONALES_COMMUNITY_SLUG } from '../../../community-policy.constants';
import { AccessCheckResult, CommunityRecord } from './types';

export async function checkGetAccess(
  supabase: SupabaseClient,
  community: CommunityRecord,
  userId?: string
): Promise<AccessCheckResult> {
  if (community.access_type === 'invitation_only') {
    return checkInvitationOnlyAccess(supabase, community.id, userId);
  }

  if (community.slug === PROFESIONALES_COMMUNITY_SLUG && userId) {
    return checkProfesionalesAccess(supabase, community.id, userId);
  }

  return { allowed: true };
}

async function checkInvitationOnlyAccess(
  supabase: SupabaseClient,
  communityId: string,
  userId?: string
): Promise<AccessCheckResult> {
  if (!userId) {
    logger.log('User not authenticated for private community');
    return {
      allowed: false,
      status: 401,
      body: { error: 'Debes iniciar sesion para ver esta comunidad', requires_auth: true },
    };
  }

  const { data: membership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (membership) return { allowed: true };

  logger.log('User not member of private community');
  return {
    allowed: false,
    status: 403,
    body: { error: 'No tienes acceso a esta comunidad', requires_membership: true },
  };
}

async function checkProfesionalesAccess(
  supabase: SupabaseClient,
  communityId: string,
  userId: string
): Promise<AccessCheckResult> {
  const { data: allMemberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('community_id', communityId);

  if (!allMemberships || allMemberships.length === 0) return { allowed: true };

  logger.log('User has other memberships, blocking Profesionales access');
  return {
    allowed: false,
    status: 403,
    body: { error: 'Ya perteneces a otra comunidad', requires_membership: true },
  };
}
