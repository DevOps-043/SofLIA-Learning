import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await params;

    // Obtener todas las reacciones del post con información del usuario
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
      .order('created_at', { ascending: false });

    if (reactionsError) {
      return NextResponse.json({ error: 'Error al obtener reacciones' }, { status: 500 });
    }

    // Agrupar reacciones por tipo con información optimizada
    const groupedReactions = reactions.reduce((acc: any, reaction: any) => {
      const type = reaction.reaction_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          users: [],
          hasUserReacted: false,
          emoji: getReactionEmoji(type)
        };
      }
      acc[type].count++;
      
      // Incluir información del usuario para el modal de detalles
      acc[type].users.push({
        id: reaction.user.id,
        name: reaction.user.display_name || 
              `${reaction.user.first_name || ''} ${reaction.user.last_name || ''}`.trim() ||
              'Usuario',
        avatar: reaction.user.profile_picture_url,
        reaction_type: reaction.reaction_type,
        created_at: reaction.created_at
      });
      
      // Verificar si el usuario actual ha reaccionado
      if (reaction.user_id === user.id) {
        acc[type].hasUserReacted = true;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Obtener estadísticas adicionales si se solicitan
    let stats = null;
    let topReactions = null;
    
    const url = new URL(request.url);
    const includeStats = url.searchParams.get('include_stats') === 'true';
    
    if (includeStats) {
      try {
        // Obtener estadísticas usando RPC
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_post_reaction_stats', { post_id: postId });
        
        if (!statsError && statsData) {
          stats = statsData;
        }
        
        // Obtener top reacciones
        const { data: topData, error: topError } = await supabase
          .rpc('get_top_reactions', { 
            post_id: postId,
            limit_count: 3 
          });
        
        if (!topError && topData) {
          topReactions = topData;
        }
      } catch (error) {
        }
    }

    // Calcular total de reacciones
    const totalReactions = Object.values(groupedReactions).reduce(
      (sum: number, reaction: any) => sum + reaction.count, 0
    );

    return NextResponse.json({ 
      reactions: groupedReactions,
      totalReactions,
      stats,
      topReactions,
      userReaction: getUserCurrentReaction(reactions, user.id)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función auxiliar para obtener emoji de reacción
function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'like': '👍',
    'love': '❤️',
    'laugh': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡'
  };
  return emojiMap[type] || '👍';
}

// Función auxiliar para obtener la reacción actual del usuario
function getUserCurrentReaction(reactions: any[], userId: string): string | null {
  const userReaction = reactions.find(r => r.user_id === userId);
  return userReaction ? userReaction.reaction_type : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }



    const { postId } = await params;
    const { reaction_type, action } = await request.json();

    if (!reaction_type) {
      return NextResponse.json({ error: 'Tipo de reacción requerido' }, { status: 400 });
    }

    // Validar tipo de reacción
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reaction_type)) {
      return NextResponse.json({ 
        error: 'Tipo de reacción inválido',
        validTypes: validReactions 
      }, { status: 400 });
    }

    // Verificar si el usuario ya tiene alguna reacción en este post
    const { data: existingReactions, error: checkError } = await supabase
      .from('community_reactions')
      .select('id, reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (checkError) {
      return NextResponse.json({ error: 'Error al verificar reacciones' }, { status: 500 });
    }

    const currentReaction = existingReactions?.[0];

    // Lógica de manejo de reacciones
    if (action === 'remove' || (currentReaction && currentReaction.reaction_type === reaction_type)) {
      // Eliminar reacción existente
      if (currentReaction) {
        const { error: deleteError } = await supabase
          .from('community_reactions')
          .delete()
          .eq('id', currentReaction.id);

        if (deleteError) {
          return NextResponse.json({ error: 'Error al eliminar reacción' }, { status: 500 });
        }

        // El trigger automáticamente decrementará el contador
        return NextResponse.json({ 
          message: 'Reacción eliminada', 
          action: 'removed',
          previousReaction: currentReaction.reaction_type
        });
      } else {
        return NextResponse.json({ 
          message: 'No hay reacción para eliminar', 
          action: 'none' 
        });
      }
    } else {
      // Agregar o cambiar reacción
      if (currentReaction) {
        // Cambiar reacción existente
        const { error: updateError } = await supabase
          .from('community_reactions')
          .update({ 
            reaction_type,
            created_at: new Date().toISOString()
          })
          .eq('id', currentReaction.id);

        if (updateError) {
          return NextResponse.json({ error: 'Error al actualizar reacción' }, { status: 500 });
        }

        return NextResponse.json({ 
          message: 'Reacción actualizada', 
          action: 'updated',
          previousReaction: currentReaction.reaction_type,
          newReaction: reaction_type
        });
      } else {
        // Crear nueva reacción
        const { data: newReaction, error: insertError } = await supabase
          .from('community_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type
          })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({ error: 'Error al crear reacción' }, { status: 500 });
        }

        // Crear notificación para el autor del post (en background)
        (async () => {
          try {
            // Obtener información del post para saber quién es el autor y el community_id
            const { data: post } = await supabase
              .from('community_posts')
              .select('user_id, community_id')
              .eq('id', postId)
              .single();

            if (post && post.user_id && post.user_id !== user.id) {
              const { AutoNotificationsService } = await import('../../../../../../../features/notifications/services/auto-notifications.service');
              await AutoNotificationsService.notifyCommunityPostReaction(
                postId,
                post.user_id,
                user.id,
                reaction_type,
                post.community_id
              );
            }
          } catch (notificationError) {
            // Error silenciado para no afectar el flujo principal
          }
        })().catch(() => {}); // Fire and forget

        // El trigger automáticamente incrementará el contador
        return NextResponse.json({ 
          message: 'Reacción agregada', 
          action: 'added',
          reaction: newReaction 
        });
      }
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}