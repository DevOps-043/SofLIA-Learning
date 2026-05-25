import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import type { AccessCheckResult } from './types'

export async function getCommunityBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('communities')
    .select('id, access_type, slug, member_count')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return { community: data, error }
}

export async function checkGetAccess(
  supabase: SupabaseClient,
  community: { id: string; access_type: string; slug: string },
  userId?: string,
): Promise<AccessCheckResult> {
  if (community.access_type === 'invitation_only') {
    return checkPrivateCommunityAccess(supabase, community.id, userId)
  }

  if (community.slug === 'profesionales' && userId) {
    const { data: allMemberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .neq('community_id', community.id)

    if (allMemberships && allMemberships.length > 0) {
      logger.log('User has other memberships: blocking access to Profesionales posts')
      return {
        allowed: false,
        status: 403,
        body: { error: 'Ya perteneces a otra comunidad', requires_membership: true },
      }
    }
  }

  return { allowed: true }
}

async function checkPrivateCommunityAccess(
  supabase: SupabaseClient,
  communityId: string,
  userId?: string,
): Promise<AccessCheckResult> {
  if (!userId) {
    return {
      allowed: false,
      status: 401,
      body: { error: 'Debes iniciar sesion para ver esta comunidad', requires_auth: true },
    }
  }

  const { data: membership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (membership) return { allowed: true }

  return {
    allowed: false,
    status: 403,
    body: { error: 'No tienes acceso a esta comunidad', requires_membership: true },
  }
}
