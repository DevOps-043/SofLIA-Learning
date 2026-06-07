import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import {
  redirectByNormalizedRole,
  type BusinessOrganizationRedirectTarget,
} from './role-redirect'

interface OrganizationRedirectRow {
  organization_id: string
  role: string | null
  organizations: { slug: string | null } | Array<{ slug: string | null }> | null
}

export interface ActiveBusinessOrganizationRedirectTarget extends BusinessOrganizationRedirectTarget {
  organizationId: string
}

type ProxySupabaseClient = ReturnType<typeof createProxySupabaseClient>

export async function loadActiveBusinessOrganizationRedirectTargets(
  supabase: ProxySupabaseClient,
  userId: string,
  limit = 2,
): Promise<ActiveBusinessOrganizationRedirectTarget[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id, role, organizations:organization_id(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(limit)
    .returns<OrganizationRedirectRow[]>()

  if (error) throw error

  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    role: row.role,
    slug: getOrganizationSlug(row),
  }))
}

export async function redirectBusinessRoleByActiveOrganization(
  request: NextRequest,
  supabase: ProxySupabaseClient,
  userId: string,
  normalizedRole: string,
) {
  const targets = await loadActiveBusinessOrganizationRedirectTargets(supabase, userId)

  if (targets.length !== 1) {
    return NextResponse.redirect(new URL('/auth/select-organization', request.url))
  }

  return redirectByNormalizedRole(request, normalizedRole, targets[0])
}

function getOrganizationSlug(row: OrganizationRedirectRow) {
  const organization = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations

  return organization?.slug ?? null
}
