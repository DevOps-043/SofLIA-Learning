import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '@/lib/supabase/server';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

import { scormInitializeSchema, type ScormInitializeBody } from '../_schemas';

type ScormUser = {
  email?: string | null;
  id: string;
  user_metadata?: {
    full_name?: string | null;
  };
};

async function handlePost(_request: NextRequest, body: ScormInitializeBody) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Unauthorized', 401);
    }

    const { packageId } = body;

    // Obtener paquete
    const { data: package_, error: packageError } = await supabase
      .from('scorm_packages')
      .select(SELECT_COLUMNS.scorm_packages)
      .eq('id', packageId)
      .eq('status', 'active')
      .single();

    if (packageError || !package_) {
      return apiError('SCORM_PACKAGE_NOT_FOUND', 'Package not found', 404);
    }

    // Buscar attempt existente o crear nuevo
    const { data: existingAttempt } = await supabase
      .from('scorm_attempts')
      .select(SELECT_COLUMNS.scorm_attempts)
      .eq('user_id', user.id)
      .eq('package_id', packageId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    let attempt = existingAttempt;

    // Si no hay attempt o el ultimo esta completo, crear nuevo
    if (
      !attempt ||
      attempt.lesson_status === 'completed' ||
      attempt.lesson_status === 'passed'
    ) {
      const newAttemptNumber = (attempt?.attempt_number || 0) + 1;

      const { data: newAttempt, error: insertError } = await supabase
        .from('scorm_attempts')
        .insert({
          user_id: user.id,
          package_id: packageId,
          attempt_number: newAttemptNumber,
          entry: 'ab-initio',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      attempt = newAttempt;
    } else {
      // Resuming - actualizar entry
      const { error: updateError } = await supabase
        .from('scorm_attempts')
        .update({
          entry: attempt.suspend_data ? 'resume' : 'ab-initio',
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Construir datos CMI iniciales
    const cmiData = buildCMIData(
      attempt as Record<string, unknown>,
      user,
      package_ as Record<string, unknown>,
    );

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      cmiData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize';
    return apiError('SCORM_INITIALIZE_FAILED', message, 500);
  }
}

function buildCMIData(
  attempt: Record<string, unknown>,
  user: ScormUser,
  package_: Record<string, unknown>,
) {
  const isScorm2004 = package_.version === 'SCORM_2004';
  const learnerName = user.user_metadata?.full_name || user.email || user.id;

  if (isScorm2004) {
    return {
      'cmi.completion_status':
        attempt.lesson_status === 'completed' ? 'completed' : 'incomplete',
      'cmi.success_status':
        attempt.lesson_status === 'passed' ? 'passed' : 'unknown',
      'cmi.location': toScormString(attempt.lesson_location),
      'cmi.suspend_data': toScormString(attempt.suspend_data),
      'cmi.score.raw': toScormString(attempt.score_raw),
      'cmi.score.min': toScormString(attempt.score_min, '0'),
      'cmi.score.max': toScormString(attempt.score_max, '100'),
      'cmi.score.scaled': toScormString(attempt.score_scaled),
      'cmi.total_time': formatTime2004(toNullableString(attempt.total_time)),
      'cmi.learner_id': user.id,
      'cmi.learner_name': learnerName,
      'cmi.entry': toScormString(attempt.entry, 'ab-initio'),
      'cmi.credit': toScormString(attempt.credit, 'credit'),
      'cmi.mode': 'normal',
    };
  }

  // SCORM 1.2
  return {
    'cmi.core.lesson_status': toScormString(attempt.lesson_status, 'not attempted'),
    'cmi.core.lesson_location': toScormString(attempt.lesson_location),
    'cmi.suspend_data': toScormString(attempt.suspend_data),
    'cmi.core.score.raw': toScormString(attempt.score_raw),
    'cmi.core.score.min': toScormString(attempt.score_min, '0'),
    'cmi.core.score.max': toScormString(attempt.score_max, '100'),
    'cmi.core.total_time': formatTime12(toNullableString(attempt.total_time)),
    'cmi.core.student_id': user.id,
    'cmi.core.student_name': learnerName,
    'cmi.core.entry': toScormString(attempt.entry, 'ab-initio'),
    'cmi.core.credit': toScormString(attempt.credit, 'credit'),
    'cmi.core.lesson_mode': 'normal',
  };
}

function toScormString(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value);
}

function toNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function formatTime12(interval: string | null): string {
  if (!interval) return '0000:00:00.00';
  // Convertir PostgreSQL interval a SCORM 1.2 format (HHHH:MM:SS.ss)
  try {
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = match[1].padStart(4, '0');
      const minutes = match[2].padStart(2, '0');
      const seconds = match[3].padStart(2, '0');
      return `${hours}:${minutes}:${seconds}.00`;
    }
  } catch {
    // fallback
  }
  return '0000:00:00.00';
}

function formatTime2004(interval: string | null): string {
  if (!interval) return 'PT0S';
  // Convertir a ISO 8601 duration (PT#H#M#S)
  try {
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      let duration = 'PT';
      if (hours > 0) duration += `${hours}H`;
      if (minutes > 0) duration += `${minutes}M`;
      if (seconds > 0 || duration === 'PT') duration += `${seconds}S`;
      return duration;
    }
  } catch {
    // fallback
  }
  return 'PT0S';
}

export const POST = withZodBody(scormInitializeSchema, handlePost);
