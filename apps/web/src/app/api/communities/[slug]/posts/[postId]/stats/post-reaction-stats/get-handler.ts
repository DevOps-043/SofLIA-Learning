import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedPostStatsUser } from './auth';
import { loadPostStatsSummary } from './post-summary';
import { loadPostReactionStats, loadTopReactions } from './stats-queries';
import { loadTopReactionUsers } from './top-users';
import type { PostReactionStatsRouteContext } from './types';

export async function handleGetPostReactionStatsRequest(
  request: NextRequest,
  { params }: PostReactionStatsRouteContext
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedPostStatsUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await params;
    const { data: stats, error: statsError } = await loadPostReactionStats(
      supabase,
      postId
    );
    if (statsError) {
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }

    const { data: topReactions, error: topError } = await loadTopReactions(
      supabase,
      postId
    );
    if (topError) {
      return NextResponse.json(
        { error: 'Error al obtener reacciones populares' },
        { status: 500 }
      );
    }

    const { data: post, error: postError } = await loadPostStatsSummary(
      supabase,
      postId
    );
    if (postError || !post) {
      return NextResponse.json({ error: 'Error al obtener información del post' }, { status: 500 });
    }

    return NextResponse.json({
      post,
      stats: stats || [],
      topReactions: topReactions || [],
      topUsers: await loadTopReactionUsers(supabase, postId),
      generated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
