import { NextRequest, NextResponse } from 'next/server';
import {
  batchCommunityPostReactionsSchema,
  type BatchCommunityPostReactionsBody,
} from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../../../../lib/supabase/server';

interface CommunityReactionRow {
  id: string;
  post_id: string;
  reaction_type: string;
  user_id: string;
  created_at: string;
}

interface AggregatedReaction {
  type: string;
  count: number;
  hasUserReacted: boolean;
  emoji: string;
}

interface PostReactionSummary {
  reactions: Record<string, AggregatedReaction>;
  totalReactions: number;
  userReaction: string | null;
}

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Endpoint optimizado para obtener reacciones de multiples posts en una sola llamada.
 * Resuelve el N+1 query problem al cargar comunidades.
 */
async function handlePost(
  _request: NextRequest,
  body: BatchCommunityPostReactionsBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();
    await params;

    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    const { postIds } = body;

    const { data: allReactions, error: reactionsError } = await supabase
      .from('community_reactions')
      .select(`
        id,
        post_id,
        reaction_type,
        user_id,
        created_at
      `)
      .in('post_id', postIds)
      .order('created_at', { ascending: false })
      .returns<CommunityReactionRow[]>();

    if (reactionsError) {
      return apiError('GET_REACTIONS_FAILED', 'Error al obtener reacciones', 500);
    }

    const reactionsByPost: Record<string, PostReactionSummary> = {};

    postIds.forEach((postId: string) => {
      const postReactions =
        (allReactions || []).filter((reaction) => reaction.post_id === postId);

      const groupedReactions = postReactions.reduce<Record<string, AggregatedReaction>>(
        (acc, reaction) => {
          const type = reaction.reaction_type;
          if (!acc[type]) {
            acc[type] = {
              type,
              count: 0,
              hasUserReacted: false,
              emoji: getReactionEmoji(type),
            };
          }
          acc[type].count++;

          if (user && reaction.user_id === user.id) {
            acc[type].hasUserReacted = true;
          }

          return acc;
        },
        {},
      );

      const totalReactions = Object.values(groupedReactions).reduce(
        (sum, reaction) => sum + reaction.count,
        0,
      );

      let userReaction = null;
      if (user) {
        const userReactionData = postReactions.find((reaction) => reaction.user_id === user.id);
        userReaction = userReactionData?.reaction_type || null;
      }

      reactionsByPost[postId] = {
        reactions: groupedReactions,
        totalReactions,
        userReaction,
      };
    });

    return NextResponse.json({
      success: true,
      reactionsByPost,
      totalPosts: postIds.length,
    });
  } catch {
    return apiError('BATCH_REACTIONS_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(batchCommunityPostReactionsSchema, handlePost);

function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
    clap: '👏',
    fire: '🔥',
    rocket: '🚀',
    eyes: '👀',
  };
  return emojiMap[type] || '👍';
}
