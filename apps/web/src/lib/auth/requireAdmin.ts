import { NextResponse } from 'next/server';
import { SessionService } from '../../features/auth/services/session.service';
import { logger } from '../logger';
import { isPlatformAdminRole, isPlatformInstructorRole } from './platform-role';

/**
 * Resultado exitoso de autenticación
 */
export interface AdminAuth {
  userId: string;
  userEmail: string;
  userRole: string;
}

interface DynamicServerUsageErrorLike {
  digest?: string
  message?: string
}

function isDynamicServerUsageError(error: unknown): error is DynamicServerUsageErrorLike {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const maybeError = error as DynamicServerUsageErrorLike
  return (
    maybeError.digest === 'DYNAMIC_SERVER_USAGE' ||
    maybeError.message?.includes('Dynamic server usage') === true
  )
}

/**
 * Verifica autenticación y autorización de administrador
 * Soporta tanto el sistema legacy como el nuevo via SessionService
 * 
 * @returns AdminAuth si el usuario es admin autenticado, o NextResponse con error
 */
export async function requireAdmin(): Promise<AdminAuth | NextResponse> {
  try {
    // PASO 1 y 2: Obtener usuario actual (maneja cookies y sesiones duales internally)
    const user = await SessionService.getCurrentUser();

    if (!user) {
      logger.warn('Admin route accessed without valid session');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autenticado o sesión expirada. Por favor, inicia sesión.' 
        },
        { status: 401 }
      );
    }

    // PASO 3: Verificar que el usuario sea Administrador
    // (predicado compartido en lib/auth/platform-role para no divergir del middleware
    // ni del copiloto de SofLIA para superadmins)
    if (!isPlatformAdminRole(user.cargo_rol)) {
      logger.warn('Non-admin user attempted to access admin route', {
        userId: user.id,
        email: user.email,
        role: user.cargo_rol 
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes. Se requiere rol de Administrador.' 
        },
        { status: 403 }
      );
    }

    // ✅ AUTENTICACIÓN Y AUTORIZACIÓN EXITOSA
    logger.auth('Admin access granted', { 
      userId: user.id, 
      email: user.email 
    });

    return {
      userId: user.id,
      userEmail: user.email ?? '',
      userRole: user.cargo_rol ?? '',
    };

  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    logger.error('Error in requireAdmin middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor.' 
      },
      { status: 500 }
    );
  }
}

/**
 * Verifica autenticación y autorización de instructor o superior
 * Permite acceso a Administradores e Instructores
 * 
 * @returns AdminAuth si el usuario es admin/instructor autenticado, o NextResponse con error
 */
export async function requireInstructor(): Promise<AdminAuth | NextResponse> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autenticado o sesión expirada.' 
        },
        { status: 401 }
      );
    }

    // Permitir Administrador e Instructor
    if (
      !isPlatformAdminRole(user.cargo_rol) &&
      !isPlatformInstructorRole(user.cargo_rol)
    ) {
      logger.warn('User without instructor permissions attempted access', {
        userId: user.id,
        role: user.cargo_rol 
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Permisos insuficientes. Se requiere rol de Instructor o Administrador.' 
        },
        { status: 403 }
      );
    }

    logger.auth('Instructor access granted', { 
      userId: user.id, 
      role: user.cargo_rol 
    });

    return {
      userId: user.id,
      userEmail: user.email ?? '',
      userRole: user.cargo_rol ?? '',
    };

  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    logger.error('Error in requireInstructor middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor.' 
      },
      { status: 500 }
    );
  }
}
