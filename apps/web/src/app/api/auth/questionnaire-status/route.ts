import { NextRequest, NextResponse } from 'next/server';
import { QuestionnaireValidationService } from '@/features/auth/services/questionnaire-validation.service';
import { SessionService } from '@/features/auth/services/session.service';
import { apiError } from '@/lib/api/errors';
import { logger } from '@/lib/utils/logger';
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit'

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    const rateLimitResponse = applyAuthRateLimit(request, user?.id ?? null)

    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401);
    }

    const status = await QuestionnaireValidationService.getQuestionnaireStatus(user.id);
    
    return NextResponse.json(status);
  } catch (error) {
    logger.error('Error obteniendo estado del cuestionario:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'Error interno del servidor.', 500);
  }
}
