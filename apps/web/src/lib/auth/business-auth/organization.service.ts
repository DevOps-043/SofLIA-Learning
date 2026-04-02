import type { createClient } from '@/lib/supabase/server'
import { authFailure, authSuccess } from './result'
import type {
  AuthResult,
  OrganizationAccessContext,
  OrganizationAccessOptions,
  OrganizationRole,
} from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface LatestOrganizationMembership {
  organization_id: string
  role: OrganizationRole
  organizations?: { id: string; slug: string } | { id: string; slug: string }[] | null
}

export interface OrganizationLoggerLike {
  auth(message: string, details?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
}

function extractOrganizationRecord(
  organization: LatestOrganizationMembership['organizations'],
): { id: string; slug: string } | undefined {
  if (!organization) {
    return undefined
  }

  if (Array.isArray(organization)) {
    return organization[0]
  }

  return organization
}

export interface ResolveOrganizationAccessDependencies {
  supabase: SupabaseClient
  userId: string
  isPlatformAdmin: boolean
  options?: OrganizationAccessOptions
  adminFallbackRole: OrganizationRole
  logger: OrganizationLoggerLike
}

export async function resolveOrganizationAccess(
  dependencies: ResolveOrganizationAccessDependencies,
): Promise<AuthResult<OrganizationAccessContext>> {
  const { supabase, userId, isPlatformAdmin, options, adminFallbackRole, logger } = dependencies

  if (options?.organizationId || options?.organizationSlug) {
    let orgQuery = supabase
      .from('organizations')
      .select('id, slug')
      .eq('is_active', true)

    if (options.organizationId) {
      orgQuery = orgQuery.eq('id', options.organizationId)
    } else if (options.organizationSlug) {
      orgQuery = orgQuery.eq('slug', options.organizationSlug)
    }

    const { data: requestedOrg, error: orgError } = await orgQuery.single()

    if (orgError || !requestedOrg) {
      logger.warn('Requested organization not found', {
        organizationId: options?.organizationId,
        organizationSlug: options?.organizationSlug,
      })
      return authFailure(404, 'Organización no encontrada.')
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', requestedOrg.id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      if (!isPlatformAdmin) {
        logger.warn('User not member of requested organization', {
          userId,
          organizationId: requestedOrg.id,
          organizationSlug: requestedOrg.slug,
        })
        return authFailure(403, 'No tienes acceso a esta organización.')
      }

      logger.auth('Platform admin accessing organization (not a member)', {
        userId,
        organizationId: requestedOrg.id,
      })

      return authSuccess({
        organizationId: requestedOrg.id,
        organizationSlug: requestedOrg.slug,
        organizationRole: adminFallbackRole,
        isOrgAdmin: adminFallbackRole === 'owner' || adminFallbackRole === 'admin',
      })
    }

    return authSuccess({
      organizationId: requestedOrg.id,
      organizationSlug: requestedOrg.slug,
      organizationRole: membership.role as OrganizationRole,
      isOrgAdmin: membership.role === 'owner' || membership.role === 'admin',
    })
  }

  const { data: userOrgs } = await supabase
    .from('organization_users')
    .select(`
      organization_id,
      role,
      joined_at,
      organizations!inner (
        id,
        slug,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('organizations.is_active', true)
    .order('joined_at', { ascending: false })
    .limit(1)

  const latestMembership = userOrgs?.[0] as LatestOrganizationMembership | undefined
  const organization = extractOrganizationRecord(latestMembership?.organizations)
  const organizationRole = latestMembership?.role

  return authSuccess({
    organizationId: latestMembership?.organization_id,
    organizationSlug: organization?.slug,
    organizationRole,
    isOrgAdmin: organizationRole === 'owner' || organizationRole === 'admin',
  })
}
