import { NextRequest, NextResponse } from 'next/server';
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

/**
 * Endpoint optimizado para obtener reacciones de múltiples posts en una sola llamada
 * Resuelve el N+1 query problem al cargar comunidades
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    // Parsear el body
    const { postIds } = await request.json();

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds es requerido y debe ser un array' }, { status: 400 });
    }

    // ✅ 1 SOLA QUERY para obtener todas las reacciones de todos los posts
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
      return NextResponse.json({ error: 'Error al obtener reacciones' }, { status: 500 });
    }

    // Agrupar reacciones por post_id
    const reactionsByPost: Record<string, PostReactionSummary> = {};

    postIds.forEach((postId: string) => {
      // Filtrar reacciones de este post
      const postReactions =
        (allReactions || []).filter((reaction) => reaction.post_id === postId);

      // Agrupar por tipo de reacción
      const groupedReactions = postReactions.reduce<Record<string, AggregatedReaction>>(
        (acc, reaction) => {
          const type = reaction.reaction_type;
          if (!acc[type]) {
            acc[type] = {
              type,
              count: 0,
              hasUserReacted: false,
              emoji: getReactionEmoji(type)
            };
          }
          acc[type].count++;
          
          // Verificar si el usuario actual ha reaccionado
          if (user && reaction.user_id === user.id) {
            acc[type].hasUserReacted = true;
          }
          
          return acc;
        },
        {}
      );

      // Calcular total de reacciones
      const totalReactions = Object.values(groupedReactions).reduce(
        (sum, reaction) => sum + reaction.count, 
        0
      );

      // Determinar la reacción del usuario actual
      let userReaction = null;
      if (user) {
        const userReactionData = postReactions.find((reaction) => reaction.user_id === user.id);
        userReaction = userReactionData?.reaction_type || null;
      }

      reactionsByPost[postId] = {
        reactions: groupedReactions,
        totalReactions,
        userReaction
      };
    });


    return NextResponse.json({ 
      success: true,
      reactionsByPost,
      totalPosts: postIds.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Helper para obtener el emoji correspondiente a cada tipo de reacción
 */
function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'like': '👍',
    'love': '❤️',
    'laugh': '😂',
    'haha': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡',
    'clap': '👏',
    'fire': '🔥',
    'rocket': '🚀',
    'eyes': '👀'
  };
  return emojiMap[type] || '👍';
}
