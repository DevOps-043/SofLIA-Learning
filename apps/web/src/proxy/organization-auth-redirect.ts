import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import { normalizeRole, redirectByNormalizedRole } from './role-redirect'
import { loadActiveBusinessOrganizationRedirectTargets } from './business-organization-redirect'
import type { ProxyLogger } from './logger'

const allowedPlans = ['team', 'business', 'enterprise']
const activeStatuses = ['active', 'trial']

export async function handleOrganizationAuthRedirect(request: NextRequest, logger: ProxyLogger) {
  const { pathname } = request.nextUrl
  if ((pathname !== '/auth' && pathname !== '/auth/') || request.nextUrl.searchParams.has('redirect')) return null

  try {
    const supabase = createProxySupabaseClient(request)
    const userId = await getAuthenticatedUserId(request, supabase)
    if (!userId) return null

    const { data: user } = await supabase.from('users').select('platform_role').eq('id', userId).single()
    const activeOrganizations = await loadActiveBusinessOrganizationRedirectTargets(supabase, userId)
    const singleOrganizationId = activeOrganizations.length === 1
      ? activeOrganizations[0].organizationId
      : null
    const customLoginRedirect = await getCustomLoginRedirect(request, singleOrganizationId, supabase)
    if (customLoginRedirect) return customLoginRedirect
    if (user) {
      const normalizedRole = normalizeRole(user.platform_role)
      logger.log('???? Usuario autenticado en /auth sin organizaci??n v??lida, redirigiendo seg??n rol:', normalizedRole)
      if (normalizedRole === 'business' || normalizedRole === 'business user') {
        if (activeOrganizations.length !== 1) {
          return NextResponse.redirect(new URL('/auth/select-organization', request.url))
        }

        return redirectByNormalizedRole(request, normalizedRole, activeOrganizations[0])
      }

      return redirectByNormalizedRole(request, normalizedRole)
    }
  } catch (error) {
    logger.error('Error verificando organizaci??n en middleware:', error)
  }
  return null
}

async function getAuthenticatedUserId(request: NextRequest, supabase: ReturnType<typeof createProxySupabaseClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id) return user.id

  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  if (!sessionCookie?.value) return null
  const { data: sessionData } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).maybeSingle()
  return sessionData?.user_id || null
}

async function getCustomLoginRedirect(request: NextRequest, organizationId: string | null, supabase: ReturnType<typeof createProxySupabaseClient>) {
  if (!organizationId) return null
  const { data: organization } = await supabase.from('organizations').select('slug, subscription_plan, subscription_status, is_active').eq('id', organizationId).single()
  if (!organization?.slug) return null
  if (!allowedPlans.includes(organization.subscription_plan ?? '') || !activeStatuses.includes(organization.subscription_status ?? '') || !organization.is_active) return null
  return NextResponse.redirect(new URL(`/auth/${organization.slug}`, request.url))
}
