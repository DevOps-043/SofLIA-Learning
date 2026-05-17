import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '../../../../../../../lib/supabase/server';

interface TopUserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
}

interface CommunityReactionUserRow {
  user_id: string;
  user: TopUserRow;
}

interface ReactionCountByUser {
  user: TopUserRow;
  count: number;
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
