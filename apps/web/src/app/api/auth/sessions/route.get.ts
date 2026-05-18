import { NextResponse } from 'next/server';

import { RefreshTokenService } from '@/lib/auth/refreshToken.service';

import { SessionService } from '@/features/auth/services/session.service';

import { apiError } from '@/lib/api/errors';

import { logger } from '@/lib/utils/logger';

import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit'

/**
 * GET /api/auth/sessions
 *
 * Obtiene la lista de sesiones activas del usuario actual
 * Útil para mostrar en la página de perfil/seguridad
 */
export async function GET(request: Request) {
  try {
    logger.log('📋 API Sessions: Obteniendo sesiones activas');
    
    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    const rateLimitResponse = applyAuthRateLimit(request, user?.id ?? null)

    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401);
    }
    
    // Obtener sesiones activas
    const sessions = await RefreshTokenService.getUserActiveSessions(user.id);
    
    logger.log('✅ API Sessions: Sesiones obtenidas', {
      userId: user.id,
      count: sessions.length
    });
    
    return NextResponse.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    logger.error('💥 API Sessions Error:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'Error al obtener sesiones.', 500);
  }
}
