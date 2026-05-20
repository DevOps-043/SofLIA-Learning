import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { clearSessionCache } from '@/lib/scorm/session-cache';
import { createClient } from '@/lib/supabase/server';

import { scormAttemptSchema, type ScormAttemptBody } from '../../_schemas';

async function handlePost(_request: NextRequest, body: ScormAttemptBody) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Unauthorized', 401);
    }

    const { attemptId } = body;

    // Verificar que el attempt pertenece al usuario
    const { data: attempt } = await supabase
      .from('scorm_attempts')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (!attempt) {
      return apiError('SCORM_ATTEMPT_NOT_FOUND', 'Not found', 404);
    }

    // Limpiar cache de sesion
    clearSessionCache(attemptId);

    // Actualizar ultima vez accedido
    await supabase
      .from('scorm_attempts')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', attemptId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('SCORM_TERMINATE_FAILED', 'Failed to terminate', 500);
  }
}

export const POST = withZodBody(scormAttemptSchema, handlePost);
