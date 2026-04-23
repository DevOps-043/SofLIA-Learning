import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedPostReactionUser } from './auth';
import { getUserCurrentReaction } from './current-reaction';
import { fetchPostReactions } from './reaction-query';
import { groupReactionsByType } from './group-reactions';
import { loadOptionalReactionStats } from './reaction-stats';
import type { PostReactionRouteContext } from './types';

export async function handleGetPostReactionsRequest(
  request: NextRequest,
  { params }: PostReactionRouteContext
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedPostReactionUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await params;
    const { data: reactions, error } = await fetchPostReactions(supabase, postId);

    if (error) {
      return NextResponse.json({ error: 'Error al obtener reacciones' }, { status: 500 });
    }

    const reactionList = reactions || [];
    const groupedReactions = groupReactionsByType(reactionList, user.id);
    const { stats, topReactions } = await loadOptionalReactionStats(
      supabase,
      postId,
      new URL(request.url).searchParams.get('include_stats') === 'true'
    );

    return NextResponse.json({
      reactions: groupedReactions,
      totalReactions: Object.values(groupedReactions).reduce(
        (sum, reaction) => sum + reaction.count,
        0
      ),
      stats,
      topReactions,
      userReaction: getUserCurrentReaction(reactionList, user.id),
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
