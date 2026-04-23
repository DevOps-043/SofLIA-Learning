import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedPostStatsUser } from './auth';
import {
  loadPostReactionStats,
  refreshPostReactionStats,
} from './stats-queries';
import type { PostReactionStatsRouteContext } from './types';

export async function handleRefreshPostReactionStatsRequest(
  request: NextRequest,
  { params }: PostReactionStatsRouteContext
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedPostStatsUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await refreshPostReactionStats(supabase);
    } catch {
      // Preserve previous behavior: refresh failures do not block stats loading.
    }

    const { postId } = await params;
    const { data: stats, error } = await loadPostReactionStats(supabase, postId);

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener estadísticas actualizadas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Estadísticas actualizadas',
      stats: stats || [],
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
