import { NextResponse } from 'next/server';

import { SessionService } from '@/features/auth/services/session.service';
import { apiError } from '@/lib/api/errors';
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit';
import { RefreshTokenService } from '@/lib/auth/refreshToken.service';
import { logger } from '@/lib/utils/logger';

/**
 * DELETE /api/auth/sessions/:tokenId
 *
 * Revoca una sesión específica.
 */
export async function DELETE(request: Request) {
  try {
    logger.log('API Sessions: Revocando sesión');

    const user = await SessionService.getCurrentUser();
    const rateLimitResponse = applyAuthRateLimit(request, user?.id ?? null);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401);
    }

    const url = new URL(request.url);
    const tokenId = url.pathname.split('/').pop();

    if (!tokenId) {
      return apiError('MISSING_TOKEN_ID', 'Token ID no proporcionado.', 400);
    }

    await RefreshTokenService.revokeToken(tokenId, 'user_revoked_manually');

    logger.log('API Sessions: Sesión revocada', {
      userId: user.id,
      tokenId
    });

    return NextResponse.json({
      success: true,
      message: 'Sesión revocada exitosamente'
    });
  } catch (error) {
    logger.error('API Sessions DELETE Error:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'Error al revocar sesión.', 500);
  }
}
