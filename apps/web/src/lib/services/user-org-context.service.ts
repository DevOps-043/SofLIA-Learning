import type { createClient } from '../supabase/server'
import { logger } from '../logger'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface UserOrgMembership {
  id: string
  organization_id: string
  job_title: string | null
  job_description: string | null
}

export interface UserOrgMembershipWithDetails extends UserOrgMembership {
  organizations: {
    id: string
    name: string
    logo_url: string | null
    brand_logo_url: string | null
    brand_favicon_url: string | null
    slug: string | null
  }
}

/**
 * Resolves the user's primary active organization membership.
 *
 * Ordering: rows with an actual joined_at date are preferred (NULLS LAST),
 * with created_at as a deterministic tiebreaker. This ensures both the profile
 * and auth/me routes always resolve the same "primary" organization.
 *
 * If organizationId is provided, it filters to that specific org instead of
 * using the ordering heuristic — useful for multi-org contexts.
 */
export async function resolveUserPrimaryMembership(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId?: string | null
): Promise<UserOrgMembership | null> {
  let query = supabase
    .from('organization_users')
    .select('id, organization_id, job_title, job_description')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  } else {
    // NULLS LAST ensures rows with actual join dates are preferred over NULL ones.
    // Without this, PostgreSQL puts NULLs first in DESC order, causing non-deterministic
    // org selection when a user belongs to multiple organizations.
    query = query
      .order('joined_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(1).maybeSingle()

  if (error) {
    logger.error('Error resolving user primary organization membership:', error)
    return null
  }

  return data as UserOrgMembership | null
}

/**
 * Same as resolveUserPrimaryMembership but also returns organization details.
 * Used by auth/me to build the full organization context in a single query.
 */
export async function resolveUserPrimaryMembershipWithOrg(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserOrgMembershipWithDetails | null> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('id, organization_id, job_title, job_description, organizations!inner(id, name, logo_url, brand_logo_url, brand_favicon_url, slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Error resolving user primary organization membership with details:', error)
    return null
  }

  return data as UserOrgMembershipWithDetails | null
}
