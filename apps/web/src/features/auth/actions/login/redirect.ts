import type {
  ActiveOrganizationMembershipRow,
  LoginSupabaseClient,
  LoginUserRecord,
  UserOrganizationMembershipRow,
} from './types'
import { getOrganizationSlug } from './organization-helpers'

export async function resolveLoginRedirect(input: {
  supabase: LoginSupabaseClient
  user: LoginUserRecord
}): Promise<string> {
  const normalizedRole = input.user.platform_role?.toLowerCase().trim()

  if (normalizedRole === 'usuario') {
    const promotedRedirect = await promoteUserWithActiveOrganization(input)
    if (promotedRedirect) {
      return promotedRedirect
    }
  }

  if (normalizedRole === 'administrador') {
    return '/admin/dashboard'
  }

  if (normalizedRole === 'instructor') {
    return '/instructor/dashboard'
  }

  if (normalizedRole === 'business' || normalizedRole === 'business user') {
    return resolveBusinessUserRedirect(input)
  }

  return '/dashboard'
}

async function promoteUserWithActiveOrganization(input: {
  supabase: LoginSupabaseClient
  user: LoginUserRecord
}): Promise<string | null> {
  const { data: activeOrg } = await input.supabase
    .from('organization_users')
    .select('organization_id, role, organizations!inner(id, slug, is_active)')
    .eq('user_id', input.user.id)
    .eq('status', 'active')
    .eq('organizations.is_active', true)
    .limit(1)
    .maybeSingle<ActiveOrganizationMembershipRow>()

  if (!activeOrg) {
    return null
  }

  await input.supabase
    .from('users')
    .update({ platform_role: 'Business' })
    .eq('id', input.user.id)

  const orgSlug = getOrganizationSlug(activeOrg.organizations)
  return orgSlug ? `/${orgSlug}/dashboard` : '/dashboard'
}

async function resolveBusinessUserRedirect(input: {
  supabase: LoginSupabaseClient
  user: LoginUserRecord
}): Promise<string> {
  const { data: userOrgs, error: orgError } = await input.supabase
    .from('organization_users')
    .select('organization_id, status, role, organizations!inner(id, name, slug, is_active)')
    .eq('user_id', input.user.id)
    .eq('status', 'active')
    .eq('organizations.is_active', true)
    .order('joined_at', { ascending: true })
    .returns<UserOrganizationMembershipRow[]>()

  if (orgError || !userOrgs || userOrgs.length === 0) {
    return '/dashboard'
  }

  if (userOrgs.length > 1) {
    return '/auth/select-organization'
  }

  const orgSlug = getOrganizationSlug(userOrgs[0].organizations)
  return orgSlug ? `/${orgSlug}/dashboard` : '/dashboard'
}
