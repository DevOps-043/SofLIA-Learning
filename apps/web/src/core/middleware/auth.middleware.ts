import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '../../lib/supabase/server';
import { logger } from '../../lib/logger';

/**
 * Roles válidos en el sistema
 * Solo estos valores son aceptados en la base de datos
 */
export const VALID_ROLES = ['Usuario', 'Instructor', 'Administrador', 'Business', 'Business User'] as const;
export type ValidRole = typeof VALID_ROLES[number];

/**
 * Configuración de rutas protegidas por rol
 */
export const ROLE_ROUTES = {
  admin: ['/admin'],
  instructor: ['/instructor', '/courses/create', '/courses/edit'],
  user: ['/dashboard', '/profile', '/communities', '/courses'],
  business: ['/business-panel']
} as const;

/**
 * Eventos de seguridad que se registran
 */
export type SecurityEvent =
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'EXPIRED_SESSION_ACCESS'
  | 'USER_NOT_FOUND'
  | 'INACTIVE_USER_ACCESS'
  | 'INVALID_ROLE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ROLE_VALIDATION_SUCCESS';

/**
 * Registra un evento de seguridad
 */
async function logSecurityEvent(
  event: SecurityEvent,
  data: {
    userId?: string;
    path?: string;
    ip?: string;
    role?: string;
    attemptedPath?: string;
    userAgent?: string;
  }
) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...data
  };

  // Logging según severidad
  if (event === 'ROLE_VALIDATION_SUCCESS') {
    logger.debug('Security validation passed', logData);
  } else {
    logger.error(`[SECURITY] ${event}`, undefined, logData);
  }

  // En producción: enviar a servicio de monitoreo
  // await sentry.captureEvent({ message: event, extra: logData });
  // await datadog.log(event, logData);
}

/**
 * Extrae la IP real del cliente considerando proxies
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Crea una respuesta de no autorizado y limpia cookies inválidas
 */
function createUnauthorizedResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL('/auth?error=unauthorized', request.url)
  );

  // Limpiar todas las cookies de sesión
  response.cookies.delete('aprende-y-aplica-session');
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

  return response;
}

/**
 * Crea una respuesta de prohibido (permisos insuficientes)
 */
function createForbiddenResponse(request: NextRequest): NextResponse {
  return NextResponse.redirect(
    new URL('/dashboard?error=insufficient_permissions', request.url)
  );
}

/**
 * Valida que el rol sea uno de los roles válidos del sistema
 */
function isValidRole(role: any): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Normaliza el rol eliminando espacios y validando formato
 */
function normalizeRole(role: any): ValidRole | null {
  if (typeof role !== 'string') {
    return null;
  }

  const trimmed = role.trim();

  if (!isValidRole(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Verifica si un rol tiene permisos para acceder a una ruta
 */
function hasRoleAccess(role: ValidRole, pathname: string): boolean {
  // Administrador tiene acceso a todo
  if (role === 'Administrador') {
    return true;
  }

  // Instructor tiene acceso a rutas de instructor y usuario
  if (role === 'Instructor') {
    const isInstructorRoute = ROLE_ROUTES.instructor.some(route =>
      pathname.startsWith(route)
    );
    const isUserRoute = ROLE_ROUTES.user.some(route =>
      pathname.startsWith(route)
    );
    const isAdminRoute = ROLE_ROUTES.admin.some(route =>
      pathname.startsWith(route)
    );

    // Instructor NO puede acceder a rutas admin
    if (isAdminRoute) {
      return false;
    }

    return isInstructorRoute || isUserRoute;
  }

  // ✅ Business tiene acceso a rutas business-panel, business-user y rutas de usuario básico
  // NOTA: Ya no existe 'Business User' en cargo_rol - todos son 'Business'
  // La diferenciación entre admin/owner y member se hace en organization_users.role
  if (role === 'Business') {
    // Rutas legacy: /business-panel (sin orgSlug)
    const isBusinessPanelRoute = ROLE_ROUTES.business.some(route => pathname.startsWith(route));
    // Rutas org-scoped: /{orgSlug}/business-panel/* y /{orgSlug}/business-user/*
    // Se detectan buscando el segmento 'business-panel' o 'business-user' en el path
    const isOrgScopedPanel = pathname.includes('/business-panel');
    const isOrgScopedUser  = pathname.includes('/business-user');
    const isUserRoute = ROLE_ROUTES.user.some(route => pathname.startsWith(route));
    const isAdminRoute = ROLE_ROUTES.admin.some(route => pathname.startsWith(route));

    // Business NO puede acceder a rutas admin
    if (isAdminRoute) {
      return false;
    }

    return isBusinessPanelRoute || isOrgScopedPanel || isOrgScopedUser || isUserRoute;
  }

  // Usuario solo tiene acceso a rutas de usuario
  if (role === 'Usuario') {
    const isUserRoute = ROLE_ROUTES.user.some(route =>
      pathname.startsWith(route)
    );
    const isAdminRoute = ROLE_ROUTES.admin.some(route =>
      pathname.startsWith(route)
    );
    const isInstructorRoute = ROLE_ROUTES.instructor.some(route =>
      pathname.startsWith(route)
    );

    // Usuario NO puede acceder a rutas admin ni instructor
    if (isAdminRoute || isInstructorRoute) {
      return false;
    }

    return isUserRoute;
  }

  return false;
}

/**
 * Interfaz del resultado de validación
 */
interface ValidationResult {
  isValid: boolean;
  userId?: string;
  role?: ValidRole;
  error?: string;
}

/**
 * Valida el acceso basado en el rol del usuario
 * Esta es la función principal que se debe usar en el middleware
 */
export async function validateRoleAccess(
  request: NextRequest,
  requiredRole?: ValidRole
): Promise<ValidationResult> {
  const pathname = request.nextUrl.pathname;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const supabase = await createClient();
    let resolvedUserId: string | null = null;

    // SISTEMA 1: Legacy session (aprende-y-aplica-session → user_session)
    const sessionCookie = request.cookies.get('aprende-y-aplica-session')?.value;
    if (sessionCookie) {
      const { data: sessionData } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionCookie)
        .single();

      if (sessionData && !sessionData.revoked && new Date(sessionData.expires_at) > new Date()) {
        resolvedUserId = sessionData.user_id;
      } else if (sessionData?.revoked) {
        await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', { userId: sessionData.user_id, path: pathname, ip: clientIp });
        return { isValid: false, error: 'Session revoked' };
      } else if (sessionData) {
        await logSecurityEvent('EXPIRED_SESSION_ACCESS', { userId: sessionData.user_id, path: pathname, ip: clientIp });
        return { isValid: false, error: 'Session expired' };
      }
    }

    // SISTEMA 2: Refresh token (access_token + refresh_token → refresh_tokens)
    // Permite que usuarios autenticados con el sistema nuevo también pasen la validación de rol.
    if (!resolvedUserId) {
      const refreshTokenVal = request.cookies.get('refresh_token')?.value;
      const accessTokenVal  = request.cookies.get('access_token')?.value;
      if (refreshTokenVal && accessTokenVal) {
        const tokenHash = crypto.createHash('sha256').update(refreshTokenVal).digest('hex');
        const { data: tokenData } = await supabase
          .from('refresh_tokens')
          .select('user_id')
          .eq('token_hash', tokenHash)
          .eq('is_revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single();
        if (tokenData?.user_id) resolvedUserId = tokenData.user_id;
      }
    }

    if (!resolvedUserId) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', { path: pathname, ip: clientIp, userAgent });
      return { isValid: false, error: 'No session found' };
    }

    // Obtener datos del usuario (incluye verificación de existencia y estado)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol, email, username')
      .eq('id', resolvedUserId)
      .single();

    if (userError || !userData) {
      await logSecurityEvent('USER_NOT_FOUND', {
        userId: resolvedUserId,
        path: pathname
      });

      return { isValid: false, error: 'User not found' };
    }

    // 6. Validar y normalizar el rol
    const normalizedRole = normalizeRole((userData as any).cargo_rol);

    if (!normalizedRole) {
      await logSecurityEvent('INVALID_ROLE', {
        userId: (userData as any).id,
        role: (userData as any).cargo_rol,
        path: pathname
      });

      return { isValid: false, error: 'Invalid role' };
    }

    // 7. Verificar permisos para la ruta (si se especificó rol requerido)
    if (requiredRole) {
      // Comparación case-sensitive después de normalización
      if (normalizedRole !== requiredRole) {
        await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
          userId: (userData as any).id,
          role: normalizedRole,
          attemptedPath: pathname,
          ip: clientIp
        });

        return {
          isValid: false,
          userId: (userData as any).id,
          role: normalizedRole,
          error: 'Insufficient permissions'
        };
      }
    }

    // 8. Verificar permisos basados en la ruta
    if (!hasRoleAccess(normalizedRole, pathname)) {
      await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: (userData as any).id,
        role: normalizedRole,
        attemptedPath: pathname,
        ip: clientIp
      });

      return {
        isValid: false,
        userId: (userData as any).id,
        role: normalizedRole,
        error: 'Route access denied'
      };
    }

    // ✅ Validación exitosa
    await logSecurityEvent('ROLE_VALIDATION_SUCCESS', {
      userId: (userData as any).id,
      role: normalizedRole,
      path: pathname
    });

    return {
      isValid: true,
      userId: (userData as any).id,
      role: normalizedRole
    };

  } catch (error) {
    logger.error('Error in role validation', error);
    return { isValid: false, error: 'Validation error' };
  }
}

/**
 * Middleware helper para validar acceso de administrador
 */
export async function validateAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request, 'Administrador');

  if (!result.isValid) {
    if (result.error === 'No session found' || result.error === 'Invalid session' || result.error === 'Session expired') {
      return createUnauthorizedResponse(request);
    }

    return createForbiddenResponse(request);
  }

  return null; // null = permitir acceso
}

/**
 * Middleware helper para validar acceso de instructor
 */
export async function validateInstructorAccess(request: NextRequest): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);

  if (!result.isValid) {
    if (result.error === 'No session found' || result.error === 'Invalid session' || result.error === 'Session expired') {
      return createUnauthorizedResponse(request);
    }

    return createForbiddenResponse(request);
  }

  // Verificar que sea Instructor o Administrador
  if (result.role !== 'Instructor' && result.role !== 'Administrador') {
    return createForbiddenResponse(request);
  }

  return null; // null = permitir acceso
}

/**
 * Middleware helper para validar acceso de usuario autenticado
 */
export async function validateUserAccess(request: NextRequest): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);

  if (!result.isValid) {
    if (result.error === 'No session found' || result.error === 'Invalid session' || result.error === 'Session expired') {
      return createUnauthorizedResponse(request);
    }

    return createForbiddenResponse(request);
  }

  return null; // null = permitir acceso
}

/**
 * Middleware helper para validar acceso de Business
 */
export async function validateBusinessAccess(request: NextRequest): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);

  if (!result.isValid) {
    if (result.error === 'No session found' || result.error === 'Invalid session' || result.error === 'Session expired') {
      return createUnauthorizedResponse(request);
    }
    return createForbiddenResponse(request);
  }

  // Verificar que sea Business o Administrador
  // NOTA: 'Business User' ya no existe como cargo_rol — todos los usuarios de organización son 'Business'
  // La distinción owner/admin/member se hace en organization_users.role, no aquí.
  if (result.role !== 'Business' && result.role !== 'Administrador') {
    return createForbiddenResponse(request);
  }

  return null; // null = permitir acceso
}
