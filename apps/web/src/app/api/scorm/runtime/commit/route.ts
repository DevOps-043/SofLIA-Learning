import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { getSessionCache } from '@/lib/scorm/session-cache';
import { createClient } from '@/lib/supabase/server';

import { scormAttemptSchema, type ScormAttemptBody } from '../_schemas';

type ScormSupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

    const cache = getSessionCache(attemptId);
    if (cache.size === 0) {
      return NextResponse.json({ success: true }); // Nada que guardar
    }

    // Mapear CMI keys a columnas de DB
    const updateData: Record<string, unknown> = {
      last_accessed_at: new Date().toISOString(),
    };

    // SCORM 1.2 y 2004 mappings
    const mappings: Record<string, string> = {
      'cmi.core.lesson_status': 'lesson_status',
      'cmi.core.lesson_location': 'lesson_location',
      'cmi.core.score.raw': 'score_raw',
      'cmi.core.score.min': 'score_min',
      'cmi.core.score.max': 'score_max',
      'cmi.core.session_time': 'session_time',
      'cmi.core.exit': 'exit_type',
      'cmi.suspend_data': 'suspend_data',
      // SCORM 2004
      'cmi.completion_status': 'lesson_status',
      'cmi.success_status': 'lesson_status',
      'cmi.location': 'lesson_location',
      'cmi.score.raw': 'score_raw',
      'cmi.score.min': 'score_min',
      'cmi.score.max': 'score_max',
      'cmi.score.scaled': 'score_scaled',
      'cmi.session_time': 'session_time',
      'cmi.exit': 'exit_type',
    };

    for (const [cmiKey, dbColumn] of Object.entries(mappings)) {
      if (cache.has(cmiKey)) {
        const value = cache.get(cmiKey)!;

        // Conversiones especiales
        if (
          dbColumn === 'score_raw' ||
          dbColumn === 'score_min' ||
          dbColumn === 'score_max'
        ) {
          const parsed = parseFloat(value);
          updateData[dbColumn] = isNaN(parsed) ? null : parsed;
        } else if (dbColumn === 'score_scaled') {
          const parsed = parseFloat(value);
          updateData[dbColumn] = isNaN(parsed) ? null : Math.max(-1, Math.min(1, parsed));
        } else if (dbColumn === 'session_time') {
          updateData[dbColumn] = parseSessionTime(value);
        } else {
          updateData[dbColumn] = value;
        }
      }
    }

    // Marcar como completado si aplica
    if (
      updateData.lesson_status === 'completed' ||
      updateData.lesson_status === 'passed'
    ) {
      updateData.completed_at = new Date().toISOString();
    }

    // Guardar en DB
    const { error } = await supabase
      .from('scorm_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .eq('user_id', user.id);

    if (error) {
      return apiError('SCORM_COMMIT_SAVE_FAILED', 'Failed to save', 500);
    }

    // Procesar interacciones si las hay
    await saveInteractions(supabase, attemptId, cache);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('SCORM_COMMIT_FAILED', 'Failed to commit', 500);
  }
}

function parseSessionTime(time: string): string {
  // SCORM 1.2: HHHH:MM:SS.ss -> PostgreSQL interval
  // SCORM 2004: PT#H#M#S -> PostgreSQL interval
  if (time.startsWith('PT')) {
    // ISO 8601 duration
    const match = time.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/
    );
    if (match) {
      const hours = match[1] || '0';
      const minutes = match[2] || '0';
      const seconds = match[3] || '0';
      return `${hours}:${minutes}:${seconds}`;
    }
  } else if (time.includes(':')) {
    // SCORM 1.2 format HHHH:MM:SS.ss
    const parts = time.split(':');
    if (parts.length >= 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return `${hours}:${minutes}:${Math.floor(seconds)}`;
    }
  }
  return '0:0:0';
}

async function saveInteractions(
  supabase: ScormSupabaseClient,
  attemptId: string,
  cache: Map<string, string>
) {
  // Buscar keys de interacciones: cmi.interactions.0.id, etc.
  const interactionKeys = Array.from(cache.keys()).filter((k) =>
    k.startsWith('cmi.interactions.')
  );

  if (interactionKeys.length === 0) return;

  // Agrupar por indice de interaccion
  const interactions = new Map<string, Record<string, string>>();

  for (const key of interactionKeys) {
    const match = key.match(/cmi\.interactions\.(\d+)\.(.+)/);
    if (match) {
      const [, index, field] = match;
      if (!interactions.has(index)) {
        interactions.set(index, {});
      }
      interactions.get(index)![field] = cache.get(key)!;
    }
  }

  // Insertar cada interaccion
  for (const [, data] of interactions) {
    if (data.id) {
      try {
        await supabase.from('scorm_interactions').upsert(
          {
            attempt_id: attemptId,
            interaction_id: data.id,
            interaction_type: data.type,
            learner_response: data.learner_response || data.student_response,
            correct_response: data['correct_responses.0.pattern'] || null,
            result: data.result,
            weighting: data.weighting ? parseFloat(data.weighting) : 1,
            latency: data.latency,
          },
          {
            onConflict: 'attempt_id,interaction_id',
          }
        );
      } catch {
        // Ignorar errores de interacciones individuales
      }
    }
  }
}

export const POST = withZodBody(scormAttemptSchema, handlePost);
