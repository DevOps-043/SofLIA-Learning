import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import { normalizeRole, redirectByNormalizedRole } from './role-redirect'
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

    const { data: user } = await supabase.from('users').select('cargo_rol').eq('id', userId).single()
    const { data: orgUser } = await supabase.from('organization_users').select('organization_id').eq('user_id', userId).eq('status', 'active').single()
    const customLoginRedirect = await getCustomLoginRedirect(request, orgUser?.organization_id || null, supabase)
    if (customLoginRedirect) return customLoginRedirect
    if (user) {
      const normalizedRole = normalizeRole(user.cargo_rol)
      logger.log('???? Usuario autenticado en /auth sin organizaci??n v??lida, redirigiendo seg??n rol:', normalizedRole)
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
  const { data: sessionData } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).single()
  return sessionData?.user_id || null
}

async function getCustomLoginRedirect(request: NextRequest, organizationId: string | null, supabase: ReturnType<typeof createProxySupabaseClient>) {
  if (!organizationId) return null
  const { data: organization } = await supabase.from('organizations').select('slug, subscription_plan, subscription_status, is_active').eq('id', organizationId).single()
  if (!organization?.slug) return null
  if (!allowedPlans.includes(organization.subscription_plan ?? '') || !activeStatuses.includes(organization.subscription_status ?? '') || !organization.is_active) return null
  return NextResponse.redirect(new URL(`/auth/${organization.slug}`, request.url))
}
