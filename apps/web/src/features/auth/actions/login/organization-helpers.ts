import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  LoginSupabaseClient,
  LoginUserRecord,
  OrganizationMembershipRedirectRow,
  OrganizationSummary,
} from './types'

export function getOrganizationSlug(
  organizations: OrganizationSummary | OrganizationSummary[] | null | undefined
): string | null {
  if (Array.isArray(organizations)) {
    return organizations[0]?.slug ?? null
  }

  return organizations?.slug ?? null
}

export async function handleNoBelongingRedirect(
  supabase: LoginSupabaseClient,
  user: Pick<LoginUserRecord, 'id'>,
  organizationId: string
) {
  const { data: memberships } = await fromLoose<OrganizationMembershipRedirectRow>(
    supabase,
    'organization_users'
  )
    .select('organization_id, organizations!inner(slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .neq('organization_id', organizationId)
    .limit(3)

  const fallback = {
    error: 'No perteneces a esta organizacion.',
    redirectTo: '/dashboard?error=not_member',
    redirectMessage:
      'No tienes acceso a esta organizacion. Seras redirigido en 5 segundos.',
  }

  if (!memberships || memberships.length === 0) {
    return fallback
  }

  if (memberships.length > 1) {
    return {
      error: 'Tu cuenta pertenece a otra organizacion.',
      redirectTo: '/auth/select-organization',
      redirectMessage:
        'Tu cuenta pertenece a otra organizacion. Seras redirigido al selector en 5 segundos.',
    }
  }

  const membershipSlug = getRedirectMembershipSlug(memberships[0])

  if (!membershipSlug) {
    return fallback
  }

  return {
    error: 'Tu cuenta no pertenece a esta organizacion.',
    redirectTo: `/${membershipSlug}/dashboard`,
    redirectMessage:
      'Tu cuenta pertenece a otra organizacion. Seras redirigido en 5 segundos.',
  }
}

function getRedirectMembershipSlug(
  record: OrganizationMembershipRedirectRow
): string | null {
  if (Array.isArray(record.organizations)) {
    return record.organizations[0]?.slug ?? null
  }

  return record.organizations?.slug ?? null
}
