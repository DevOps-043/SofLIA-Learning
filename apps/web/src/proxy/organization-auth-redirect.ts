import { NextResponse, type NextRequest } from 'next/server'
import { createProxySupabaseClient } from './supabase'
import { normalizeRole, redirectByNormalizedRole } from './role-redirect'
import type { ProxyLogger } from './logger'

const allowedPlans = ['team', 'business', 'enterprise']
const activeStatuses = ['active', 'trial']

export async function handleOrganizationAuthRedirect(request: NextRequest, logger: ProxyLogger) {
  const { pathname } = request.nextUrl
  if ((pathname !== '/auth' && pathname !== '/auth/') || request.nextUrl.searchParams.has('redirect')) return null
  const sessionCookie = request.cookies.get('aprende-y-aplica-session')
  if (!sessionCookie) return null

  try {
    const supabase = createProxySupabaseClient(request)
    const { data: sessionData } = await supabase.from('user_session').select('user_id').eq('jwt_id', sessionCookie.value).eq('revoked', false).gt('expires_at', new Date().toISOString()).single()
    if (!sessionData) return null
    const { data: user } = await supabase.from('users').select('cargo_rol').eq('id', sessionData.user_id).single()
    const { data: orgUser } = await supabase.from('organization_users').select('organization_id').eq('user_id', sessionData.user_id).eq('status', 'active').single()
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

async function getCustomLoginRedirect(request: NextRequest, organizationId: string | null, supabase: ReturnType<typeof createProxySupabaseClient>) {
  if (!organizationId) return null
  const { data: organization } = await supabase.from('organizations').select('slug, subscription_plan, subscription_status, is_active').eq('id', organizationId).single()
  if (!organization?.slug) return null
  if (!allowedPlans.includes(organization.subscription_plan ?? '') || !activeStatuses.includes(organization.subscription_status ?? '') || !organization.is_active) return null
  return NextResponse.redirect(new URL(`/auth/${organization.slug}`, request.url))
}
