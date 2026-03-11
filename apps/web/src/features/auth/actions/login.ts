'use server'

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

    // 3. Buscar usuario y validar contraseña
    // OPTIMIZADO: Una sola consulta con OR en lugar de dos secuenciales
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, is_banned, ban_reason')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .maybeSingle()

    if (error || !user) {
      return { error: 'Credenciales inválidas' }
    }

    console.log('👤 [loginAction] Usuario encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      cargo_rol: user.cargo_rol
    });

    // â­ MODERACIÓN: Verificar si el usuario está baneado
    if ((user as any).is_banned) {
      return {
        error: `âŒ Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${(user as any).ban_reason || ''}`,
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
        // Usuario NO pertenece a esta organización - buscar su organización correcta
        let correctSlug: string | null = null

        // Buscar en organization_users (más reciente por joined_at)
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id, joined_at, organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)

        if (userOrgs && userOrgs.length > 0) {
          correctSlug = userOrgs[0].organizations?.slug || null
        }

        // Retornar error con información de redirección
        if (correctSlug) {
          return {
            error: 'Este usuario no pertenece a esta organización',
            redirectTo: `/auth/${correctSlug}`,
            redirectMessage: `Serás redirigido a tu organización en 5 segundos...`
          }
        } else {
          return {
            error: 'Este usuario no pertenece a esta organización',
            redirectTo: '/auth',
            redirectMessage: 'Serás redirigido al login principal en 5 segundos...'
          }
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

      console.log('ðŸ“‹ [loginAction] Contexto obtenido:', {
        hasHeaders: !!headersList,
        userAgent: userAgent.substring(0, 50),
        ip
      });

      // Crear Request mock para RefreshTokenService
      const requestHeaders = new Headers()
      requestHeaders.set('user-agent', userAgent)
      requestHeaders.set('x-real-ip', ip)
      const mockRequest = new Request('http://localhost', {
        headers: requestHeaders
      })

      // 6.1. Crear sesión con refresh tokens (genera tokens y los guarda en DB)

      const sessionInfo = await RefreshTokenService.createSession(
        user.id,
        parsed.rememberMe,
        mockRequest
      )

      // 6.2. Crear sesión legacy ANTES de establecer cookies

      const legacySession = await SessionService.createLegacySession(
        user.id,
        parsed.rememberMe
      )

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
        logger.info('ðŸ”” Iniciando creación de notificación de login', { userId: user.id })
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
            logger.warn('â±ï¸ Timeout en notificación de login, continuando', { userId: user.id })
          } else {
            logger.error('âŒ Error en notificación de login:', {
              userId: user.id,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        })
        logger.info('✅ Notificación de login procesada', { userId: user.id })
      } catch (notificationError) {
        // Log del error pero no bloquear el login
        logger.error('âŒ Error en notificación de login:', {
          userId: user.id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError)
        })
      }

    } catch (sessionError) {
      // Log del error para debugging
      console.error('âŒ [loginAction] Error crítico creando sesión:', {
        error: sessionError,
        message: (sessionError as any)?.message,
        stack: (sessionError as any)?.stack
      })
      return { error: 'Error al crear la sesión. Por favor, intenta nuevamente.' }
    }

    // 7. Limpiar sesiones expiradas (mantenimiento)
    try {
      await AuthService.clearExpiredSessions()
    } catch (clearError) {
      // No fallar el login si falla la limpieza
    }

    // 7.5. Actualizar last_login_at en la tabla users
    try {
      const { error: updateLoginError } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)
      
      if (updateLoginError) {
        console.warn('âš ï¸ No se pudo actualizar last_login_at:', updateLoginError)
      }
    } catch (loginUpdateError) {
      // No fallar el login si falla la actualización del timestamp
    }

    // 8. REDIRECCIÓN BASADA EN CARGO_ROL (Enfoque B2B)
    // - Administrador â†’ /admin/dashboard
    // - Instructor â†’ /instructor/dashboard (Panel de Instructor)
    // - Business â†’ /business-panel/dashboard (Panel Admin Empresas) - REQUIERE organización
    // - Business User â†’ /business-user/dashboard (Dashboard Usuario Business) - REQUIERE organización
    // - Usuario (o cualquier otro) â†’ /dashboard (Tour SOFLIA + Planes)

    const normalizedRole = user.cargo_rol?.toLowerCase().trim();
    console.log('ðŸŽ¯ [loginAction] Determinando redirección según cargo_rol:', {
      cargo_rol: user.cargo_rol,
      normalizedRole
    });

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
        .maybeSingle()

      if (activeOrg) {
        // Promote user to Business
        await supabase
          .from('users')
          .update({ cargo_rol: 'Business' })
          .eq('id', user.id)

        const orgSlug = (activeOrg.organizations as any)?.slug
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

      if (orgError || !userOrgs || userOrgs.length === 0) {
        console.log('âš ï¸ [loginAction] Usuario Business sin organización activa:', {
          userId: user.id,
          cargo_rol: normalizedRole,
          error: orgError?.message
        })
        redirectTo = '/dashboard'; // Sin organización, ir al dashboard normal
      } else if (userOrgs.length > 1) {
        // Usuario pertenece a MÚLTIPLES organizaciones - mostrar selector
        console.log('ðŸ¢ [loginAction] Usuario Business con múltiples organizaciones:', {
          userId: user.id,
          cargo_rol: normalizedRole,
          organizationCount: userOrgs.length
        })
        redirectTo = '/auth/select-organization';
      } else {
        // Usuario pertenece a UNA sola organización - redirigir directamente
        const userOrg = userOrgs[0]
        const orgSlug = (userOrg.organizations as any)?.slug

        console.log('✅ [loginAction] Usuario Business con organización única:', {
          userId: user.id,
          cargo_rol: normalizedRole,
          organizationId: userOrg.organization_id,
          organizationSlug: orgSlug
        })

        // Redirigir a la ruta de la organización
        if (orgSlug) {
          redirectTo = `/${orgSlug}/dashboard`;
        } else {
          // Fallback: sin slug, ir al dashboard general
          redirectTo = '/dashboard';
        }
      }
    }

    console.log('🚀 [loginAction] Redirigiendo a:', redirectTo);

    // Devolver success con la URL de redirección
    return { success: true, redirectTo }
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
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
    const errorMessage = (error as any)?.message || 'Error inesperado al iniciar sesión';
    return { error: errorMessage }
  }
}
