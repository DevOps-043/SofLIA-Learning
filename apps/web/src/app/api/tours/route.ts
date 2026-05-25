import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '../../../features/auth/services/session.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Database } from '../../../lib/supabase/types';
import { tourProgressSchema, type TourProgressBody } from './schema';

// ---------------------------------------------------------------------------
// Singleton admin client
// Re-creating SupabaseClient on every request is wasteful: each instantiation
// allocates a new connection pool and auth state machine. A module-level
// singleton is safe here because the credentials are read-only env vars that
// never change at runtime.
// ---------------------------------------------------------------------------
let _adminClient: SupabaseClient<Database> | null = null;

function getAdminClient(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de entorno de Supabase no configuradas');
  }

  _adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

const VALID_ACTIONS = new Set(['start', 'step', 'complete', 'skip']);

function isMissingTourProgressInfrastructureError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    text.includes('user_tour_progress')
  );
}

// ---------------------------------------------------------------------------
// GET /api/tours?tourId=<id>
// Verifica si el usuario ya vio un tour especifico.
// No cacheamos: el estado puede cambiar inmediatamente por POST complete/skip.
// Cachear un "no visto" haria que el tour reaparezca al navegar rapido.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    if (!tourId) {
      return NextResponse.json({ error: 'tourId es requerido' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('user_tour_progress')
      .select(SELECT_COLUMNS.user_tour_progress)
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .maybeSingle();

    if (error) {
      techDebtLogger.error('[GET /api/tours] DB error:', error);
      if (isMissingTourProgressInfrastructureError(error)) {
        // Don't claim the user has seen the tour just because the table is
        // missing — that masks infrastructure problems. Return 503 with an
        // explicit reason so the client can degrade gracefully without
        // pretending writes succeeded.
        return NextResponse.json(
          {
            success: false,
            reason: 'infrastructure_unavailable',
            hasSeenTour: false,
            tourProgress: null,
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Error al verificar tour' }, { status: 500 });
    }

    const hasSeenTour = Boolean(data?.completed_at || data?.skipped_at);

    return NextResponse.json(
      { success: true, hasSeenTour, tourProgress: data ?? null },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    techDebtLogger.error('[GET /api/tours] Unexpected error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/tours
// Registra progreso: start | step | complete | skip
// No cacheamos: es escritura y necesita ser inmediata.
// ---------------------------------------------------------------------------
async function handlePost(_request: NextRequest, body: TourProgressBody) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { tourId, action, stepReached } = body;
    const supabase = getAdminClient();

    // Single read to check existence — we only SELECT id + step_reached
    const { data: existing, error: existingError } = await supabase
      .from('user_tour_progress')
      .select('id, step_reached')
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .maybeSingle();

    if (existingError) {
      techDebtLogger.error('[POST /api/tours] Read DB error:', existingError);
      if (isMissingTourProgressInfrastructureError(existingError)) {
        return NextResponse.json(
          { success: false, reason: 'infrastructure_unavailable', tourProgress: null },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 });
    }

    let result;

    if (existing) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (action === 'complete') {
        updateData.completed_at = new Date().toISOString();
      } else if (action === 'skip') {
        updateData.skipped_at = new Date().toISOString();
      }

      // Only advance step_reached, never decrease it (idempotent)
      if (
        stepReached !== undefined &&
        stepReached > (existing.step_reached ?? 0)
      ) {
        updateData.step_reached = stepReached;
      }

      result = await supabase
        .from('user_tour_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        tour_id: tourId,
        step_reached: stepReached ?? 0,
      };

      if (action === 'complete') {
        insertData.completed_at = new Date().toISOString();
      } else if (action === 'skip') {
        insertData.skipped_at = new Date().toISOString();
      }

      result = await supabase
        .from('user_tour_progress')
        .insert(insertData)
        .select()
        .single();
    }

    if (result.error) {
      techDebtLogger.error('[POST /api/tours] DB error:', result.error);
      if (isMissingTourProgressInfrastructureError(result.error)) {
        return NextResponse.json(
          { success: false, reason: 'infrastructure_unavailable', tourProgress: null },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tourProgress: result.data });
  } catch (err) {
    techDebtLogger.error('[POST /api/tours] Unexpected error:', err);
    return apiError('TOUR_PROGRESS_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(tourProgressSchema, handlePost);
