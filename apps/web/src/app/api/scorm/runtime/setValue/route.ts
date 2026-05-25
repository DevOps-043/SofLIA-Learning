import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizeCMIValue, validateCMIKey } from '@/lib/scorm/sanitize';
import { setSessionValue } from '@/lib/scorm/session-cache';
import { createClient } from '@/lib/supabase/server';

import { scormSetValueSchema, type ScormSetValueBody } from '../../_schemas';

async function handlePost(_request: NextRequest, body: ScormSetValueBody) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Unauthorized', 401);
    }

    const { attemptId, key, value } = body;

    // Validar que el key es un CMI key valido
    if (!validateCMIKey(key)) {
      return apiError('INVALID_CMI_KEY', 'Invalid CMI key', 400);
    }

    // Validar que el attempt pertenece al usuario
    const { data: attempt } = await supabase
      .from('scorm_attempts')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (!attempt) {
      return apiError('SCORM_ATTEMPT_NOT_FOUND', 'Not found', 404);
    }

    // Sanitizar y guardar en cache de sesion
    const sanitizedValue = sanitizeCMIValue(key, String(value));
    setSessionValue(attemptId, key, sanitizedValue);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('SCORM_SET_VALUE_FAILED', 'Failed to set value', 500);
  }
}

export const POST = withZodBody(scormSetValueSchema, handlePost);
