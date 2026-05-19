import { NextRequest, NextResponse } from 'next/server';
import {
  communityPostReactionSchema,
  type CommunityPostReactionBody,
} from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../../../../lib/supabase/server';

interface CommunityReactionUserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
}

interface CommunityReactionRow {
  id: string;
  reaction_type: string;
  created_at: string;
  user_id: string;
  user: CommunityReactionUserRow;
}

interface GroupedReactionUser {
  id: string;
  name: string;
  avatar: string | null;
  reaction_type: string;
  created_at: string;
}

interface GroupedReaction {
  type: string;
  count: number;
  users: GroupedReactionUser[];
  hasUserReacted: boolean;
  emoji: string;
}

type RouteContext = { params: Promise<{ slug: string; postId: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();

    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { postId } = await params;

    const { data: reactions, error: reactionsError } = await supabase
      .from('community_reactions')
      .select(`
        id,
        reaction_type,
        created_at,
        user_id,
        user:user_id (
          id,
          first_name,
          last_name,
          display_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .returns<CommunityReactionRow[]>();

    if (reactionsError) {
      return apiError('GET_REACTIONS_FAILED', 'Error al obtener reacciones', 500);
    }

    const reactionList = reactions || [];
    const groupedReactions = reactionList.reduce<Record<string, GroupedReaction>>((acc, reaction) => {
      const type = reaction.reaction_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          users: [],
          hasUserReacted: false,
          emoji: getReactionEmoji(type),
        };
      }
      acc[type].count++;

      acc[type].users.push({
        id: reaction.user.id,
        name:
          reaction.user.display_name ||
          `${reaction.user.first_name || ''} ${reaction.user.last_name || ''}`.trim() ||
          'Usuario',
        avatar: reaction.user.profile_picture_url,
        reaction_type: reaction.reaction_type,
        created_at: reaction.created_at,
      });

      if (reaction.user_id === user.id) {
        acc[type].hasUserReacted = true;
      }

      return acc;
    }, {});

    let stats = null;
    let topReactions = null;

    const url = new URL(request.url);
    const includeStats = url.searchParams.get('include_stats') === 'true';

    if (includeStats) {
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_post_reaction_stats', { post_id: postId });

        if (!statsError && statsData) {
          stats = statsData;
        }

        const { data: topData, error: topError } = await supabase
          .rpc('get_top_reactions', {
            post_id: postId,
            limit_count: 3,
          });

        if (!topError && topData) {
          topReactions = topData;
        }
      } catch {
        // Extra reaction stats are best-effort.
      }
    }

    const totalReactions = Object.values(groupedReactions).reduce(
      (sum, reaction) => sum + reaction.count,
      0,
    );

    return NextResponse.json({
      reactions: groupedReactions,
      totalReactions,
      stats,
      topReactions,
      userReaction: getUserCurrentReaction(reactionList, user.id),
    });
  } catch {
    return apiError('GET_REACTIONS_FAILED', 'Error interno del servidor', 500);
  }
}

function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
  };
  return emojiMap[type] || '👍';
}

function getUserCurrentReaction(reactions: CommunityReactionRow[], userId: string): string | null {
  const userReaction = reactions.find((reaction) => reaction.user_id === userId);
  return userReaction ? userReaction.reaction_type : null;
}

async function handlePost(
  _request: NextRequest,
  body: CommunityPostReactionBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();

    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { postId } = await params;
    const { reaction_type, action } = body;

    const { data: existingReactions, error: checkError } = await supabase
      .from('community_reactions')
      .select('id, reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (checkError) {
      return apiError('CHECK_REACTIONS_FAILED', 'Error al verificar reacciones', 500);
    }

    const currentReaction = existingReactions?.[0];

    if (action === 'remove' || (currentReaction && currentReaction.reaction_type === reaction_type)) {
      if (currentReaction) {
        const { error: deleteError } = await supabase
          .from('community_reactions')
          .delete()
          .eq('id', currentReaction.id);

        if (deleteError) {
          return apiError('DELETE_REACTION_FAILED', 'Error al eliminar reacción', 500);
        }

        return NextResponse.json({
          message: 'Reacción eliminada',
          action: 'removed',
          previousReaction: currentReaction.reaction_type,
        });
      }

      return NextResponse.json({
        message: 'No hay reacción para eliminar',
        action: 'none',
      });
    }

    if (currentReaction) {
      const { error: updateError } = await supabase
        .from('community_reactions')
        .update({
          reaction_type,
          created_at: new Date().toISOString(),
        })
        .eq('id', currentReaction.id);

      if (updateError) {
        return apiError('UPDATE_REACTION_FAILED', 'Error al actualizar reacción', 500);
      }

      return NextResponse.json({
        message: 'Reacción actualizada',
        action: 'updated',
        previousReaction: currentReaction.reaction_type,
        newReaction: reaction_type,
      });
    }

    const { data: newReaction, error: insertError } = await supabase
      .from('community_reactions')
      .insert({
        post_id: postId,
        user_id: user.id,
        reaction_type,
      })
      .select()
      .single();

    if (insertError) {
      return apiError('CREATE_REACTION_FAILED', 'Error al crear reacción', 500);
    }

    void (async () => {
      try {
        const { data: post } = await supabase
          .from('community_posts')
          .select('user_id, community_id')
          .eq('id', postId)
          .single();

        if (post && post.user_id && post.user_id !== user.id) {
          const { AutoNotificationsService } = await import(
            '../../../../../../../features/notifications/services/auto-notifications.service'
          );
          await AutoNotificationsService.notifyCommunityPostReaction(
            postId,
            post.user_id,
            user.id,
            reaction_type,
            post.community_id,
          );
        }
      } catch {
        // Background notification must not affect reaction creation.
      }
    })();

    return NextResponse.json({
      message: 'Reacción agregada',
      action: 'added',
      reaction: newReaction,
    });
  } catch {
    return apiError('REACTION_MUTATION_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(communityPostReactionSchema, handlePost);
