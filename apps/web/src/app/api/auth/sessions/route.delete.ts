import { NextResponse } from 'next/server';

import { RefreshTokenService } from '@/lib/auth/refreshToken.service';

import { SessionService } from '@/features/auth/services/session.service';

import { logger } from '@/lib/utils/logger';

import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit'

/**
 * DELETE /api/auth/sessions/:tokenId
 *
 * Revoca una sesión específica
 */
export async function DELETE(request: Request) {
  try {
    logger.log('🗑️ API Sessions: Revocando sesión');
    
    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    const rateLimitResponse = applyAuthRateLimit(request, user?.id ?? null)

    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado'
        },
        { status: 401 }
      );
    }
    
    // Extraer tokenId de la URL
    const url = new URL(request.url);
    const tokenId = url.pathname.split('/').pop();
    
    if (!tokenId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token ID no proporcionado'
        },
        { status: 400 }
      );
    }
    
    // Revocar token
    await RefreshTokenService.revokeToken(tokenId, 'user_revoked_manually');
    
    logger.log('✅ API Sessions: Sesión revocada', {
      userId: user.id,
      tokenId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Sesión revocada exitosamente'
    });
    
  } catch (error) {
    logger.error('💥 API Sessions DELETE Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al revocar sesión'
      },
      { status: 500 }
    );
  }
}
