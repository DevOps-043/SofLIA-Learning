'use server'

import { fromLoose } from '@/lib/supabase/looseQuery'
import { createClient } from '../../../lib/supabase/server'
import { AuthService } from '../services/auth.service'
import { SessionService } from '../services/session.service'
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service'
import { SECURE_COOKIE_OPTIONS, getCustomCookieOptions } from '../../../lib/auth/cookie-config'
import { z } from 'zod'
// redirect no se usa directamente - devolvemos redirectTo para que el cliente maneje la navegación
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { logger } from '../../../lib/logger'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'El correo o usuario es requerido').regex(/^\S+$/, 'No se permiten espacios'),
  password: z.string().min(1, 'La contraseña es requerida').regex(/^\S+$/, 'No se permiten espacios'),
  rememberMe: z.boolean().default(false),
})

type LoginSupabaseClient = Awaited<ReturnType<typeof createClient>>

interface LoginUserRecord {
  id: string
  username: string | null
  email: string | null
  password_hash: string | null
  email_verified: boolean | null
  cargo_rol: string | null
  is_banned: boolean | null
  ban_reason: string | null
}

interface OrganizationMembershipRedirectRow {
  organization_id: string
  organizations:
    | {
        slug: string | null
      }
    | Array<{
        slug: string | null
      }>
    | null
}

interface OrganizationSummary {
  id?: string
  is_active?: boolean | null
  name?: string | null
  slug: string | null
}

interface ActiveOrganizationMembershipRow {
  organization_id: string
  organizations: OrganizationSummary | OrganizationSummary[] | null
  role: string | null
}

interface UserOrganizationMembershipRow {
  organization_id: string
  organizations: OrganizationSummary | OrganizationSummary[] | null
  role: string | null
  status: string
}

interface ErrorWithDigest {
  digest: string
}

function hasDigest(error: unknown): error is ErrorWithDigest {
  return typeof error === 'object' && error !== null && 'digest' in error && typeof (error as ErrorWithDigest).digest === 'string'
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function getUnknownErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}

function getRedirectMembershipSlug(record: OrganizationMembershipRedirectRow): string | null {
  if (Array.isArray(record.organizations)) {
    return record.organizations[0]?.slug ?? null
  }

  return record.organizations?.slug ?? null
}

const EXPIRED_SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000
let lastExpiredSessionCleanupAt = 0
let expiredSessionCleanupPromise: Promise<void> | null = null

function scheduleExpiredSessionCleanup(): void {
  const now = Date.now()

  if (
    expiredSessionCleanupPromise ||
    now - lastExpiredSessionCleanupAt < EXPIRED_SESSION_CLEANUP_INTERVAL_MS
  ) {
    return
  }

  lastExpiredSessionCleanupAt = now
  expiredSessionCleanupPromise = AuthService.clearExpiredSessions()
    .catch(() => undefined)
    .finally(() => {
      expiredSessionCleanupPromise = null
    })
}

function getOrganizationSlug(
  organizations: OrganizationSummary | OrganizationSummary[] | null | undefined,
): string | null {
  if (Array.isArray(organizations)) {
    return organizations[0]?.slug ?? null
  }

  return organizations?.slug ?? null
}

async function handleNoBelongingRedirect(
  supabase: LoginSupabaseClient,
  user: Pick<LoginUserRecord, 'id'>,
  organizationId: string,
) {
  const { data: memberships } = await fromLoose<OrganizationMembershipRedirectRow>(
    supabase,
    'organization_users',
  )
    .select('organization_id, organizations!inner(slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .neq('organization_id', organizationId)
    .limit(3)

  const fallback = {
    error: 'No perteneces a esta organización.',
    redirectTo: '/dashboard?error=not_member',
    redirectMessage:
      'No tienes acceso a esta organización. Serás redirigido en 5 segundos.',
  }

  if (!memberships || memberships.length === 0) {
    return fallback
  }

  if (memberships.length > 1) {
    return {
      error: 'Tu cuenta pertenece a otra organización.',
      redirectTo: '/auth/select-organization',
      redirectMessage:
        'Tu cuenta pertenece a otra organización. Serás redirigido al selector en 5 segundos.',
    }
  }

  const membershipSlug = getRedirectMembershipSlug(memberships[0])

  if (!membershipSlug) {
    return fallback
  }

  return {
    error: 'Tu cuenta no pertenece a esta organización.',
    redirectTo: `/${membershipSlug}/dashboard`,
    redirectMessage:
      'Tu cuenta pertenece a otra organización. Serás redirigido en 5 segundos.',
  }
}

export async function loginAction(formData: FormData) {
  try {

    // 1. Validar datos
    const parsed = loginSchema.parse({
      emailOrUsername: formData.get('emailOrUsername'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'true',
    })

    // 2. Crear cliente Supabase
    const supabase = await createClient()

    // 3. Obtener contexto de organización si viene de login personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()
    const invitationToken = formData.get('invitationToken')?.toString()
    const bulkInviteToken = formData.get('bulkInviteToken')?.toString()

    // 3. Buscar usuario y validar contraseña
    // OPTIMIZADO: Una sola consulta con OR en lugar de dos secuenciales
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, is_banned, ban_reason')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .maybeSingle<LoginUserRecord>()

    if (error || !user) {
      return { error: 'Credenciales inválidas' }
    }


    // Moderación: verificar si el usuario está baneado
    if (user.is_banned) {
      return {
        error: `Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${user.ban_reason || ''}`,
        banned: true
      }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    if (!user.password_hash) {

      return { error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.' }
    }

    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)

    if (!passwordValid) {

      // Crear notificación de intento de inicio de sesión fallido
      try {
        const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          headersList.get('x-real-ip') ||
          'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'

        await AutoNotificationsService.notifyLoginFailed(user.id, ip, userAgent, {
          timestamp: new Date().toISOString()
        })
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
        // Error silenciado para no exponer información
      }

      return { error: 'Credenciales inválidas' }
    }

    // 4.5. Validar contexto de organización si viene de login personalizado
    if (organizationId && organizationSlug) {

      // Verificar que la organización existe y tiene suscripción válida
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, subscription_plan, subscription_status, is_active')
        .eq('id', organizationId)
        .eq('slug', organizationSlug)
        .single()

      if (orgError || !organization) {
        return { error: 'Organización no encontrada' }
      }

      // Validar que puede usar login personalizado
      // Ampliamos planes y estados para evitar falsos negativos en organizaciones válidas
      const allowedPlans = ['team', 'business', 'enterprise', 'pro', 'premium', 'basic']
      const activeStatuses = ['active', 'trial', 'trialing']

      const planOk = !organization.subscription_plan || allowedPlans.includes(organization.subscription_plan)
      const statusOk = !organization.subscription_status || activeStatuses.includes(organization.subscription_status)
      const isActiveOk = organization.is_active === undefined || organization.is_active === null || organization.is_active === true

      if (!planOk || !statusOk || !isActiveOk) {
        return { error: 'Esta organización no tiene acceso a login personalizado' }
      }

      // Verificar pertenencia a organización solo via organization_users
      // (users.organization_id fue eliminada)

      // Verificar organization_users
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id, joined_at')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      const belongsToOrganization = !!orgUser

      if (!belongsToOrganization) {
        // ✅ [NUEVO] Si no pertenece pero trae token de invitación, intentar consumirla
        if (invitationToken || bulkInviteToken) {

          const { consumeInvitationAction, consumeBulkInvitationAction } = await import('./invitation')
          
          let consumeResult;
          if (invitationToken) {
            consumeResult = await consumeInvitationAction(invitationToken, organizationId, user.id)
          } else if (bulkInviteToken) {
            consumeResult = await consumeBulkInvitationAction(bulkInviteToken, user.id)
          }

          if (consumeResult?.success) {
            // Ahora sí pertenece, podemos continuar el flujo normal
          } else {
            console.warn('[loginAction] Falló el consumo de invitación:', consumeResult?.error)
            // Procedemos al error de redirección normal si no se pudo unir
            return handleNoBelongingRedirect(supabase, user, organizationId)
          }
        } else {
          // No trae token, procede con la redirección normal
          return handleNoBelongingRedirect(supabase, user, organizationId)
        }
      }
    }

    // 5. Verificar email (RF-012) - TEMPORAL: Comentado
    // if (!user.email_verified) {
    //   return { 
    //     error: 'Debes verificar tu email antes de iniciar sesión',
    //     requiresVerification: true,
    //     userId: user.id 
    //   }
    // }

    // 6. Crear sesión personalizada (sin Supabase Auth)

    try {
      // ✅ Obtener cookieStore DENTRO del try para mantener el contexto AsyncLocalStorage
      const cookieStore = await cookies()
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || 'unknown'
      const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown'


      // Crear Request mock para RefreshTokenService
      const requestHeaders = new Headers()
      requestHeaders.set('user-agent', userAgent)
      requestHeaders.set('x-real-ip', ip)
      const mockRequest = new Request('http://localhost', {
        headers: requestHeaders
      })

      // 6.1 + 6.2. Crear ambas sesiones en paralelo — son independientes entre sí
      const [sessionInfo, legacySession] = await Promise.all([
        RefreshTokenService.createSession(user.id, parsed.rememberMe, mockRequest),
        SessionService.createLegacySession(user.id, parsed.rememberMe),
      ])

      // 6.3. Establecer TODAS las cookies usando la misma instancia de cookieStore
      // IMPORTANTE: Reutilizar cookieStore obtenido anteriormente para mantener el contexto
      // NOTA: cookieStore.set() NO es async en Next.js 15 - no requiere await

      // Establecer cookie access_token
      cookieStore.set('access_token', sessionInfo.accessToken, {
        ...SECURE_COOKIE_OPTIONS,
        expires: sessionInfo.accessExpiresAt,
      });

      // Establecer cookie refresh_token
      cookieStore.set('refresh_token', sessionInfo.refreshToken, {
        ...SECURE_COOKIE_OPTIONS,
        expires: sessionInfo.refreshExpiresAt,
      });

      // Establecer cookie legacy
      const maxAge = parsed.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      cookieStore.set('aprende-y-aplica-session', legacySession.sessionToken, {
        ...getCustomCookieOptions(maxAge),
        expires: legacySession.expiresAt,
      });

      // Crear notificación de login (con timeout para no bloquear demasiado)
      try {
        logger.info('Iniciando creación de notificación de login', { userId: user.id })
        const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')

        // Usar Promise.race con timeout para no bloquear el login más de 2 segundos
        await Promise.race([
          AutoNotificationsService.notifyLoginSuccess(user.id, ip, userAgent, {
            rememberMe: parsed.rememberMe,
            timestamp: new Date().toISOString()
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]).catch((error) => {
          // Si es timeout, continuar sin bloquear
          if (error instanceof Error && error.message === 'Timeout') {
            logger.warn('Timeout en notificación de login, continuando', { userId: user.id })
          } else {
            logger.error('Error en notificación de login:', {
              userId: user.id,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        })
        logger.info('Notificación de login procesada', { userId: user.id })
      } catch (notificationError) {
        // Log del error pero no bloquear el login
        logger.error('Error en notificación de login:', {
          userId: user.id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError)
        })
      }

    } catch (sessionError) {
      // Log del error para debugging
      console.error('[loginAction] Error crítico creando sesión:', {
        error: sessionError,
        message: getUnknownErrorMessage(sessionError, 'Error desconocido'),
        stack: getUnknownErrorStack(sessionError)
      })
      return { error: 'Error al crear la sesión. Por favor, intenta nuevamente.' }
    }

    // 7. Limpiar sesiones expiradas (mantenimiento) fuera del camino critico.
    scheduleExpiredSessionCleanup()

    // 7.5. Actualizar last_login_at — fire-and-forget, no bloquea la respuesta
    void supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.warn('No se pudo actualizar last_login_at:', error)
      })
      .catch(() => undefined)

    // 8. Redirección basada en cargo_rol (enfoque B2B)
    // - Administrador -> /admin/dashboard
    // - Instructor -> /instructor/dashboard (panel de instructor)
    // - Business -> /business-panel/dashboard (panel admin empresas) - requiere organización
    // - Business User -> /business-user/dashboard (dashboard usuario business) - requiere organización
    // - Usuario (o cualquier otro) -> /dashboard (tour SOFLIA + planes)

    const normalizedRole = user.cargo_rol?.toLowerCase().trim();

    // En lugar de usar redirect(), devolver la URL para que el cliente maneje la navegación
    // Esto evita problemas de "redirect count exceeded" en Next.js
    let redirectTo = '/dashboard'; // Default

    // Edge case: Si es 'usuario' pero ya tiene org activa (empresa aprobada/unión aprobada),
    // actualizar cargo_rol y redirigir correctamente
    if (normalizedRole === 'usuario') {
      const { data: activeOrg } = await supabase
        .from('organization_users')
        .select('organization_id, role, organizations!inner(id, slug, is_active)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('organizations.is_active', true)
        .limit(1)
        .maybeSingle<ActiveOrganizationMembershipRow>()

      if (activeOrg) {
        // Promote user to Business
        await supabase
          .from('users')
          .update({ cargo_rol: 'Business' })
          .eq('id', user.id)

        const orgSlug = getOrganizationSlug(activeOrg.organizations)
        if (orgSlug) {
          redirectTo = `/${orgSlug}/dashboard`
        }

        return { success: true, redirectTo }
      }
    }

    if (normalizedRole === 'administrador') {
      redirectTo = '/admin/dashboard';
    } else if (normalizedRole === 'instructor') {
      redirectTo = '/instructor/dashboard';
    } else if (normalizedRole === 'business' || normalizedRole === 'business user') {
      // Para roles de empresa, verificar organizaciones del usuario
      const { data: userOrgs, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, status, role, organizations!inner(id, name, slug, is_active)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('organizations.is_active', true)
        .order('joined_at', { ascending: true })
        .returns<UserOrganizationMembershipRow[]>()

      if (orgError || !userOrgs || userOrgs.length === 0) {
        redirectTo = '/dashboard'; // Sin organización, ir al dashboard normal
      } else if (userOrgs.length > 1) {
        // Usuario pertenece a MÚLTIPLES organizaciones - mostrar selector
        redirectTo = '/auth/select-organization';
      } else {
        // Usuario pertenece a UNA sola organización - redirigir directamente
        const userOrg = userOrgs[0]
        const orgSlug = getOrganizationSlug(userOrg.organizations)


        // Redirigir a la ruta de la organización
        if (orgSlug) {
          redirectTo = `/${orgSlug}/dashboard`;
        } else {
          // Fallback: sin slug, ir al dashboard general
          redirectTo = '/dashboard';
        }
      }
    }


    // Devolver success con la URL de redirección
    return { success: true, redirectTo }
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (hasDigest(error)) {
      const digest = error.digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección, no un error - re-lanzar para que Next.js la maneje
        throw error
      }
    }

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError?.message || 'Error de validación' }
    }

    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      // Mensajes de error más específicos según el tipo
      if (error.message.includes('password_hash') || error.message.includes('password')) {
        return { error: 'Error al verificar las credenciales. Por favor, intenta nuevamente.' }
      }

      if (error.message.includes('session') || error.message.includes('cookie')) {
        return { error: 'Error al crear la sesión. Por favor, verifica las cookies de tu navegador.' }
      }
    }

    // Proporcionar mensaje de error más descriptivo
    const errorMessage = getUnknownErrorMessage(error, 'Error inesperado al iniciar sesión');
    return { error: errorMessage }
  }
}
