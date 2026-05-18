import { NextRequest, NextResponse } from 'next/server';

import {
  isRefreshTokenAuthError,
} from '@/lib/auth/refresh-token.errors';

import { apiError } from '@/lib/api/errors';
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
      const response = apiError('SESSION_EXPIRED', 'Sesión expirada.', 401);

      clearSessionCookies(response);
      return response;
    }

    return apiError('INTERNAL_SERVER_ERROR', 'Error al renovar token.', 500);
  }
}
