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

    // Obtener estadísticas detalladas del post
    const { data: stats, error: statsError } = await supabase
      .rpc('get_post_reaction_stats', { post_id: postId });

    if (statsError) {
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }

    // Obtener las reacciones más populares
    const { data: topReactions, error: topError } = await supabase
      .rpc('get_top_reactions', { 
        post_id: postId,
        limit_count: 3 
      });

    if (topError) {
      return NextResponse.json({ error: 'Error al obtener reacciones populares' }, { status: 500 });
    }

    // Obtener información del post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, title, reaction_count, created_at')
      .eq('id', postId)
      .single();

    if (postError) {
      return NextResponse.json({ error: 'Error al obtener información del post' }, { status: 500 });
    }

    // Obtener usuarios que más reaccionan
    const { data: topUsers, error: usersError } = await supabase
      .from('community_reactions')
      .select(`
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
      .then(data => {
        if (data.error) return data;
        
        // Agrupar por usuario y contar reacciones
        const userCounts = data.data.reduce((acc: any, reaction: any) => {
          const userId = reaction.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              user: reaction.user,
              count: 0
            };
          }
          acc[userId].count++;
          return acc;
        }, {});

        // Ordenar por cantidad de reacciones
        const sortedUsers = Object.values(userCounts)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);

        return { data: sortedUsers, error: null };
      });

    if (usersError) {
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        reaction_count: post.reaction_count,
        created_at: post.created_at
      },
      stats: stats || [],
      topReactions: topReactions || [],
      topUsers: topUsers?.data || [],
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
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

    // Refrescar estadísticas
    try {
      const { error: refreshError } = await supabase
        .rpc('refresh_post_reaction_stats');

      if (refreshError) {
        }
    } catch (error) {
      }

    // Obtener estadísticas actualizadas
    const { data: stats, error: statsError } = await supabase
      .rpc('get_post_reaction_stats', { post_id: postId });

    if (statsError) {
      return NextResponse.json({ error: 'Error al obtener estadísticas actualizadas' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Estadísticas actualizadas',
      stats: stats || [],
      refreshed_at: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
