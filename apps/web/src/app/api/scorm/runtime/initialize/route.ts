import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await req.json();

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    // Obtener paquete
    const { data: package_, error: packageError } = await supabase
      .from('scorm_packages')
      .select('*')
      .eq('id', packageId)
      .eq('status', 'active')
      .single();

    if (packageError || !package_) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Buscar attempt existente o crear nuevo
    const { data: existingAttempt } = await supabase
      .from('scorm_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('package_id', packageId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    let attempt = existingAttempt;

    // Si no hay attempt o el último está completo, crear nuevo
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
    const cmiData = buildCMIData(attempt, user, package_);

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      cmiData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildCMIData(attempt: Record<string, unknown>, user: { id: string }, package_: Record<string, unknown>) {
  const isScorm2004 = package_.version === 'SCORM_2004';

  if (isScorm2004) {
    return {
      'cmi.completion_status':
        attempt.lesson_status === 'completed' ? 'completed' : 'incomplete',
      'cmi.success_status':
        attempt.lesson_status === 'passed' ? 'passed' : 'unknown',
      'cmi.location': attempt.lesson_location || '',
      'cmi.suspend_data': attempt.suspend_data || '',
      'cmi.score.raw': attempt.score_raw?.toString() || '',
      'cmi.score.min': attempt.score_min?.toString() || '0',
      'cmi.score.max': attempt.score_max?.toString() || '100',
      'cmi.score.scaled': attempt.score_scaled?.toString() || '',
      'cmi.total_time': formatTime2004(attempt.total_time),
      'cmi.learner_id': user.id,
      'cmi.learner_name': user.user_metadata?.full_name || user.email,
      'cmi.entry': attempt.entry || 'ab-initio',
      'cmi.credit': attempt.credit || 'credit',
      'cmi.mode': 'normal',
    };
  }

  // SCORM 1.2
  return {
    'cmi.core.lesson_status': attempt.lesson_status || 'not attempted',
    'cmi.core.lesson_location': attempt.lesson_location || '',
    'cmi.suspend_data': attempt.suspend_data || '',
    'cmi.core.score.raw': attempt.score_raw?.toString() || '',
    'cmi.core.score.min': attempt.score_min?.toString() || '0',
    'cmi.core.score.max': attempt.score_max?.toString() || '100',
    'cmi.core.total_time': formatTime12(attempt.total_time),
    'cmi.core.student_id': user.id,
    'cmi.core.student_name': user.user_metadata?.full_name || user.email,
    'cmi.core.entry': attempt.entry || 'ab-initio',
    'cmi.core.credit': attempt.credit || 'credit',
    'cmi.core.lesson_mode': 'normal',
  };
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
