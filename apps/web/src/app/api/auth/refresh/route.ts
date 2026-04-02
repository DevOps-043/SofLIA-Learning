import { NextRequest, NextResponse } from 'next/server';

import {
  isRefreshTokenAuthError,
  RefreshTokenError,
} from '@/lib/auth/refresh-token.errors';
import { RefreshTokenService } from '@/lib/auth/refreshToken.service';
import { logger } from '@/lib/utils/logger';

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  response.cookies.delete('aprende-y-aplica-session');
}

export async function POST(request: NextRequest) {
  try {
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

export async function GET(request: NextRequest) {
  try {
    logger.log('API Refresh: Obteniendo estado de sesion');

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No hay sesion activa',
      });
    }

    if (refreshToken) {
      try {
        const sessionInfo = await RefreshTokenService.refreshSession();

        return NextResponse.json({
          success: true,
          authenticated: true,
          userId: sessionInfo.userId,
          accessExpiresAt: sessionInfo.accessExpiresAt,
          refreshExpiresAt: sessionInfo.refreshExpiresAt,
        });
      } catch (error) {
        if (error instanceof RefreshTokenError) {
          const response = NextResponse.json({
            success: false,
            authenticated: false,
            message: 'Sesion invalida o expirada',
          });

          if (error.status === 401) {
            clearSessionCookies(response);
          }

          return response;
        }

        throw error;
      }
    }

    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Token de sesion incompleto',
    });
  } catch (error) {
    logger.error('API Refresh GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estado de sesion',
      },
      { status: 500 }
    );
  }
}
