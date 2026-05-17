import { NextRequest, NextResponse } from 'next/server';

import {
  isRefreshTokenAuthError,
  RefreshTokenError,
} from '@/lib/auth/refresh-token.errors';

import { RefreshTokenService } from '@/lib/auth/refreshToken.service';

import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit'

import { logger } from '@/lib/utils/logger';

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('aprende-y-aplica-session');
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = applyAuthRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    logger.log('API Refresh: Iniciando renovacion de token');

    const sessionInfo = await RefreshTokenService.refreshSession();

    logger.log('API Refresh: Token renovado exitosamente', {
      accessExpiresAt: sessionInfo.accessExpiresAt,
      userId: sessionInfo.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Token renovado exitosamente',
      expiresAt: sessionInfo.accessExpiresAt,
    });
  } catch (error) {
    logger.error('API Refresh Error:', error);

    if (isRefreshTokenAuthError(error)) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Sesion expirada',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );

      clearSessionCookies(response);
      return response;
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al renovar token',
        message:
          error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
