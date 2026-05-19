import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { LiaLogger } from '@/lib/analytics/lia-logger';
import { withZodBody } from '@/lib/api/with-validation';
import { apiError } from '@/lib/api/errors';

import { liaFeedbackSchema, type LiaFeedbackInput } from './schema';

async function handleFeedback(_request: NextRequest, body: LiaFeedbackInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401);
    }

    const liaLogger = new LiaLogger(user.id);
    await liaLogger.logFeedback(body.messageId, body.feedbackType, body.rating, body.comment);

    return NextResponse.json({
      success: true,
      messageId: body.messageId,
      feedbackType: body.feedbackType,
    });
  } catch {
    return apiError('LIA_FEEDBACK_ERROR', 'Error al registrar feedback.', 500);
  }
}

export const POST = withZodBody(liaFeedbackSchema, handleFeedback);
