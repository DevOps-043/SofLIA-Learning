import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'
import { RefreshTokenService } from './src/lib/auth/refreshToken.service'
import {
  assessAgentTraffic,
  shouldRequireAutomationChallenge,
  shouldBlockAutomatedSensitiveAccess,
} from './src/lib/security/agent-traffic-policy'
import { recordSecurityEvent } from './src/lib/security/security-events'
import {
  createVerificationChallenge,
  getVerificationChallengeCookieOptions,
  isHumanVerificationActiveForPath,
  readSecurityStateFromRequest,
  serializeVerificationChallenge,
  VERIFICATION_CHALLENGE_COOKIE_NAME,
} from './src/lib/security/security-state'
import {
  validateTrustedAgentCookie,
  validateTrustedAgentHeaders,
} from './src/lib/security/trusted-agent-auth'
import {
  validateAdminAccess,
  validateInstructorAccess,
  validateUserAccess,
  validateBusinessAccess,
  ROLE_ROUTES
} from './src/core/middleware/auth.middleware'
import { applyRateLimit, RATE_LIMITS, addRateLimitHeaders, checkRateLimit } from './src/core/lib/rate-limit'
import { rejectOversizedRequest } from './src/lib/api/request-size'
import { applyCorsHeaders, enforceCors } from './src/lib/security/cors'
import {
  getOrCreateCorrelationId,
  setCorrelationId,
} from './src/lib/observability/correlation'

function withCorrelationHeader<T extends NextResponse>(response: T, correlationId: string) {
  setCorrelationId(response.headers, correlationId)
  return response
}

function hasSupabaseAuthTokenCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'),
    )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const correlationId = getOrCreateCorrelationId(request.headers)
  setCorrelationId(request.headers, correlationId)

  const corsResponse = enforceCors(request)
  if (corsResponse) {
    return withCorrelationHeader(corsResponse, correlationId)
  }

  const oversizedRequestResponse = rejectOversizedRequest(request)
  if (oversizedRequestResponse) {
    return withCorrelationHeader(oversizedRequestResponse, correlationId)
  }

  const trafficAssessment = assessAgentTraffic(request)
  const trustedAgentFromHeaders = validateTrustedAgentHeaders(request)
  const trustedAgentFromCookie = validateTrustedAgentCookie(request)
  const trustedAgent = trustedAgentFromHeaders.trusted
    ? trustedAgentFromHeaders
    : trustedAgentFromCookie
  const securityState = readSecurityStateFromRequest(request)
  const hasVerifiedHumanCookie = isHumanVerificationActiveForPath(
    securityState,
    pathname,
  )

  if (trustedAgent.trusted) {
    recordSecurityEvent('trusted-agent-authenticated', {
      pathname,
      method: request.method,
      userAgent: trafficAssessment.userAgent,
      ip: trafficAssessment.ip,
      metadata: {
        agentId: trustedAgent.agentId,
        source: trustedAgentFromHeaders.trusted ? 'headers' : 'cookie',
      },
    })
  } else if (
    trustedAgentFromHeaders.reasons.length > 0 ||
    trustedAgentFromCookie.reasons.length > 0
  ) {
    recordSecurityEvent('trusted-agent-auth-failed', {
      pathname,
      method: request.method,
      userAgent: trafficAssessment.userAgent,
      ip: trafficAssessment.ip,
      reasons: [
        ...trustedAgentFromHeaders.reasons,
        ...trustedAgentFromCookie.reasons,
      ],
      metadata: {
        agentId: request.headers.get('x-soflia-agent-id') || undefined,
      },
    })
  }
  
  // ✅ RATE LIMITING (Issue #20)
  // Aplicar rate limiting antes de cualquier procesamiento
  
  // 1. Rate limiting estricto para auth endpoints
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'auth');
    if (rateLimitResponse) return withCorrelationHeader(rateLimitResponse, correlationId);
  }
  
  // 2. Rate limiting estricto para password reset
  if (pathname.startsWith('/api/auth/reset-password') || pathname.startsWith('/api/auth/forgot-password')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.strict, 'password');
    if (rateLimitResponse) return withCorrelationHeader(rateLimitResponse, correlationId);
  }
  
  // 3. Rate limiting para operaciones de creación
  if (request.method === 'POST' && (
    pathname.includes('/create') || 
    pathname.startsWith('/api/admin/communities') ||
    pathname.startsWith('/api/courses') && pathname.includes('create')
  )) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.create, 'create');
    if (rateLimitResponse) return withCorrelationHeader(rateLimitResponse, correlationId);
  }
  
  // 4. Rate limiting para uploads
  if (pathname.startsWith('/api/upload') || pathname.includes('/upload')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.upload, 'upload');
    if (rateLimitResponse) return withCorrelationHeader(rateLimitResponse, correlationId);
  }
  
  // 5. Rate limiting para admin endpoints
  if (pathname.startsWith('/api/admin')) {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.admin, 'admin');
    if (rateLimitResponse) return withCorrelationHeader(rateLimitResponse, correlationId);
  }
  
  // 6. Rate limiting general para todos los API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.api, 'api');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return withCorrelationHeader(rateLimitResult.response, correlationId);
    }
    // Guardar info de rate limit para agregar headers después
    request.headers.set('X-Rate-Limit-Info', JSON.stringify({
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset.toISOString()
    }));
  }
  
  // console.log('🚀 Middleware ejecutándose para:', pathname);
  
  // Actualizar sesión de Supabase. `updateSession` ya ejecuta `auth.getUser()`
  // (refresca cookies) y nos devuelve el usuario nativo: lo reutilizamos abajo en
  // la validación de rol y el chequeo de suspensión en lugar de re-validar el JWT
  // contra el Auth server en cada paso (antes: 3 round trips; ahora: 1).
  const { response: sessionResponse, user: nativeSessionUser } = await updateSession(request);
  let response = sessionResponse;
  const preResolvedUserId = nativeSessionUser?.id ?? null;

  // SECURITY: Descomponer el path para detectar rutas con orgSlug dinámico.
  // Las rutas /{orgSlug}/business-panel/* y /{orgSlug}/business-user/* NO empiezan
  // con '/business-panel', por lo que un startsWith simple las deja sin protección.
  // Ejemplo: '/board-ready/business-panel/dashboard' → pathParts = ['board-ready', 'business-panel', 'dashboard']
  const pathParts = pathname.split('/').filter(Boolean);
  const isOrgScopedBizPanel = pathParts.length >= 2 && pathParts[1] === 'business-panel';
  const isOrgScopedBizUser  = pathParts.length >= 2 && pathParts[1] === 'business-user';

  // Rutas protegidas por rol
  const isAdminRoute      = ROLE_ROUTES.admin.some(route => pathname.startsWith(route));
  const isInstructorRoute = ROLE_ROUTES.instructor.some(route => pathname.startsWith(route));
  const isUserRoute       = ROLE_ROUTES.user.some(route => pathname.startsWith(route));
  // Las rutas de negocio incluyen: /business-panel (legacy) + /{orgSlug}/business-panel/* y /{orgSlug}/business-user/*
  const isBusinessRoute   = ROLE_ROUTES.business.some(route => pathname.startsWith(route))
                            || isOrgScopedBizPanel
                            || isOrgScopedBizUser;
  const authRoutes = ['/auth'];

  // Verificar si es una ruta protegida
  const isProtectedRoute = isAdminRoute || isInstructorRoute || isUserRoute || isBusinessRoute;
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // console.log('📍 Ruta protegida:', isProtectedRoute, 'Ruta auth:', isAuthRoute);
  
  // Verificar cookies (sistema legacy y nuevo)
  const sessionCookie = request.cookies.get('aprende-y-aplica-session');
  const accessTokenCookie = request.cookies.get('access_token');
  const refreshTokenCookie = request.cookies.get('refresh_token');
  
  const hasLegacySession = !!sessionCookie?.value;
  const hasAccessToken = !!accessTokenCookie?.value;
  const hasRefreshToken = !!refreshTokenCookie?.value;
  const hasSupabaseAuthSession = hasSupabaseAuthTokenCookie(request);
  const hasSession = hasLegacySession || hasAccessToken || hasSupabaseAuthSession;

  if (
    shouldBlockAutomatedSensitiveAccess({
      pathname,
      assessment: trafficAssessment,
      securityState,
      trustedAgent,
    })
  ) {
    recordSecurityEvent('automated-sensitive-access', {
      pathname,
      method: request.method,
      userAgent: trafficAssessment.userAgent,
      ip: trafficAssessment.ip,
      reasons: trafficAssessment.reasons,
    })

    return withCorrelationHeader(new NextResponse('Forbidden', {
      status: 403,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      },
    }), correlationId)
  }

  if (
    shouldRequireAutomationChallenge({
      request,
      pathname,
      assessment: trafficAssessment,
      securityState,
      trustedAgent,
      hasVerifiedHumanCookie,
    })
  ) {
    const challenge = createVerificationChallenge({
      returnTo: `${pathname}${request.nextUrl.search}`,
      userAgent: trafficAssessment.userAgent,
    })
    const verificationUrl = new URL('/verification', request.url)
    verificationUrl.searchParams.set('returnTo', challenge.returnTo)

    recordSecurityEvent('automation-challenge-required', {
      pathname,
      method: request.method,
      userAgent: trafficAssessment.userAgent,
      ip: trafficAssessment.ip,
      reasons: trafficAssessment.reasons,
      metadata: {
        agentId: trustedAgent.agentId,
        automationSignalScore: securityState?.automationSignalScore || 0,
        honeypotHitAt: securityState?.honeypotHitAt,
      },
    })

    const challengeResponse = NextResponse.redirect(verificationUrl)
    challengeResponse.cookies.set(
      VERIFICATION_CHALLENGE_COOKIE_NAME,
      serializeVerificationChallenge(challenge),
      getVerificationChallengeCookieOptions(),
    )

    return withCorrelationHeader(challengeResponse, correlationId)
  }
  
  // Para debugging: mostrar cookies
  // console.log('🍪 Cookies detectadas:', {
  // legacy: hasLegacySession,
  // access: hasAccessToken,
  // refresh: hasRefreshToken
  // });
  
  // Si es una ruta protegida, verificar y refrescar tokens si es necesario
  if (isProtectedRoute) {
    // Si no hay ningún tipo de sesión, redirigir a login
    if (!hasSession && !hasRefreshToken) {
      // console.log('� Redirigiendo a /auth - no hay sesión para ruta protegida');
      return withCorrelationHeader(
        NextResponse.redirect(new URL('/auth?error=session_required', request.url)),
        correlationId,
      );
    }
    
    // Si tiene refresh token pero no access token, intentar refrescar
    if (hasRefreshToken && !hasAccessToken) {
      // console.log('🔄 Intentando refrescar access token expirado');
      try {
        await RefreshTokenService.refreshSession();
        // console.log('✅ Access token refrescado exitosamente');
        
        // Crear nueva respuesta con cookies actualizadas
        response = NextResponse.next();
        
        // Las cookies ya fueron establecidas por RefreshTokenService.refreshSession()
        // Solo necesitamos continuar con la request
        
      } catch (error) {
        // console.log('❌ Error refrescando token:', error);
        // console.log('🔒 Redirigiendo a /auth - token refresh falló');
        
        // Crear respuesta de redirección y limpiar cookies inválidas
        const redirectResponse = NextResponse.redirect(
          new URL('/auth?error=session_expired', request.url)
        );
        
        redirectResponse.cookies.delete('access_token');
        redirectResponse.cookies.delete('refresh_token');
        redirectResponse.cookies.delete('aprende-y-aplica-session');
        
        return withCorrelationHeader(redirectResponse, correlationId);
      }
    }
    
    // ✅ VALIDACIÓN DE ROL ROBUSTA (Issue #16)
    // Verificar permisos basados en el rol del usuario
    // console.log('🔐 Validando permisos de rol para:', pathname);
    
    let roleValidationResponse: NextResponse | null = null;

    if (isAdminRoute) {
      // console.log('🔐 Validando acceso de Administrador');
      roleValidationResponse = await validateAdminAccess(request, preResolvedUserId);
    } else if (isInstructorRoute) {
      // console.log('🔐 Validando acceso de Instructor');
      roleValidationResponse = await validateInstructorAccess(request, preResolvedUserId);
    } else if (isBusinessRoute) {
      // console.log('🔐 Validando acceso de Business');
      roleValidationResponse = await validateBusinessAccess(request, preResolvedUserId);
    } else if (isUserRoute) {
      // console.log('🔐 Validando acceso de Usuario');
      roleValidationResponse = await validateUserAccess(request, preResolvedUserId);
    }

    // Si la validación de rol devuelve una respuesta, significa que el acceso fue denegado
    if (roleValidationResponse) {
      // console.log('❌ Acceso denegado por validación de rol');
      return withCorrelationHeader(roleValidationResponse, correlationId);
    }

    // SECURITY: Verificar suspensión del usuario en rutas org-scoped.
    // Si el usuario está suspendido en la organización de la URL, redirigir a /suspended.
    // Esto cubre /{orgSlug}/business-panel/* y /{orgSlug}/business-user/*
    if ((isOrgScopedBizPanel || isOrgScopedBizUser) && !pathname.includes('/suspended')) {
      try {
        const { createServerClient } = await import('@supabase/ssr');
        const supabaseForSuspension = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() { return request.cookies.getAll(); },
              setAll() {},
            },
          }
        );

        const orgSlug = pathParts[0];
        // Reutilizamos el usuario nativo ya validado por `updateSession`; solo si
        // no existe (sesión legacy) recurrimos al lookup por cookie de sesión.
        let authenticatedUserId: string | null = preResolvedUserId;

        if (!authenticatedUserId) {
          const sessionCookieVal = request.cookies.get('aprende-y-aplica-session')?.value;
          if (sessionCookieVal) {
            const { data: sessionRow } = await supabaseForSuspension
              .from('user_session')
              .select('user_id')
              .eq('jwt_id', sessionCookieVal)
              .eq('revoked', false)
              .gt('expires_at', new Date().toISOString())
              .single();

            authenticatedUserId = sessionRow?.user_id ?? null;
          }
        }

        if (authenticatedUserId) {
          const { data: membership } = await supabaseForSuspension
            .from('organization_users')
            .select('status, organizations!inner(slug)')
            .eq('user_id', authenticatedUserId)
            .eq('organizations.slug', orgSlug)
            .single();

          if (membership?.status === 'suspended') {
            return withCorrelationHeader(
              NextResponse.redirect(new URL(`/${orgSlug}/suspended`, request.url)),
              correlationId,
            );
          }
        }
      } catch {
        // En caso de error, continuar — la API también verifica suspensión
      }
    }

    // console.log('✅ Validación de rol exitosa');
  }
  
  // Si es una ruta de auth y hay sesión válida, redirigir al dashboard.
  // Excluir /auth/select-organization: usuarios autenticados con múltiples orgs
  // necesitan acceder a esta página para elegir su contexto activo.
  const isSelectOrgRoute = pathname.startsWith('/auth/select-organization');
  if (isAuthRoute && !isSelectOrgRoute && hasSession) {
    // console.log('✅ Redirigiendo a /dashboard - usuario autenticado en ruta auth');
    return withCorrelationHeader(
      NextResponse.redirect(new URL('/dashboard', request.url)),
      correlationId,
    );
  }
  
  // console.log('➡️ Continuando sin redirección');
  
  // Agregar headers de rate limit a la respuesta si están disponibles
  const rateLimitInfo = request.headers.get('X-Rate-Limit-Info');
  if (rateLimitInfo) {
    try {
      const { limit, remaining, reset } = JSON.parse(rateLimitInfo);
      response = addRateLimitHeaders(response, limit, remaining, new Date(reset));
    } catch (error) {
      // console.warn('Error agregando headers de rate limit:', error);
    }
  }

  response = applyCorsHeaders(response, request);

  return withCorrelationHeader(response, correlationId);
}

export const config = {
  runtime: 'nodejs', // Usar Node.js runtime para soportar crypto y bcrypt
  matcher: [
    // Excluir: archivos estáticos, imágenes, y callbacks de OAuth para evitar loops de redirección
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
