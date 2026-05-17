import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultOrganizationContext } from './organization-context.defaults'
import { readOrganizationIdentifier } from './organization-context.request'
import type {
  OrganizationContext,
  OrganizationIdentifier,
  OrganizationRole,
} from './organization-context.types'

async function findActiveOrganization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  identifier: OrganizationIdentifier,
) {
  let orgQuery = supabase.from('organizations').select('id, slug, name')

  if (identifier.organizationId) {
    orgQuery = orgQuery.eq('id', identifier.organizationId)
  } else if (identifier.organizationSlug) {
    orgQuery = orgQuery.eq('slug', identifier.organizationSlug)
  }

  return orgQuery.eq('is_active', true).single()
}

async function findOrganizationMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string,
) {
  return supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
}

function buildOrganizationContext(input: {
  organizationId: string
  organizationSlug: string
  role: OrganizationRole
}): OrganizationContext {
  return {
    organizationId: input.organizationId,
    organizationSlug: input.organizationSlug,
    role: input.role,
    isB2B: true,
    isOrgAdmin: input.role === 'owner' || input.role === 'admin',
  }
}

export async function getOrganizationContext(
  request: NextRequest,
  userId: string,
): Promise<OrganizationContext> {
  const identifier = readOrganizationIdentifier(request)

  if (!identifier.organizationId && !identifier.organizationSlug) {
    return defaultOrganizationContext
  }

  const supabase = await createClient()
  const { data: organization, error: orgError } = await findActiveOrganization(
    supabase,
    identifier,
  )

  if (orgError || !organization) {
    return defaultOrganizationContext
  }

  const { data: membership, error: membershipError } = await findOrganizationMembership(
    supabase,
    organization.id,
    userId,
  )

  if (membershipError || !membership) {
    return defaultOrganizationContext
  }

  return buildOrganizationContext({
    organizationId: organization.id,
    organizationSlug: organization.slug,
    role: membership.role as OrganizationRole,
  })
}
