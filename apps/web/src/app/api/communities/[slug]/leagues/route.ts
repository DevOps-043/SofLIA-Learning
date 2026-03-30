import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { formatApiError, logError } from '@/core/utils/api-errors';

// Definir las ligas basadas en puntos
const LEAGUE_SYSTEM = {
  gold: { min: 0, max: 499, name: 'Liga Oro', color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
  platinum: { min: 500, max: 999, name: 'Liga Platino', color: 'from-gray-300 to-gray-500', icon: '🥈' },
  diamond: { min: 1000, max: Infinity, name: 'Liga Diamante', color: 'from-blue-400 to-blue-600', icon: '💎' }
};

// Sistema de puntos por acción
const POINTS_SYSTEM = {
  post: 10,
  comment: 5,
  reaction: 2,
  popular_post: 15
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, slug, access_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Obtener todos los miembros de la comunidad con sus puntos
    let members = [];
    
    try {
      // Intentar obtener miembros con join directo
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          users!inner (
            id,
            email,
            first_name,
            last_name,
            username,
            profile_picture_url,
            points
          )
        `)
        .eq('community_id', community.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) {
        // 🚀 OPTIMIZACIÓN: Si falla el join, obtener datos por separado con Map para O(1) lookup
        const { data: membersData2, error: membersError2 } = await supabase
          .from('community_members')
          .select('id, role, joined_at, user_id') // Solo campos necesarios
          .eq('community_id', community.id)
          .eq('is_active', true);

        if (membersError2) {
          throw new Error('No se pudo acceder a la tabla community_members');
        }

        if (membersData2 && membersData2.length > 0) {
          const userIds = membersData2.map(m => m.user_id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, username, profile_picture_url, points')
            .in('id', userIds);

          if (usersError) {
            throw new Error('No se pudo obtener información de usuarios');
          }

          // Crear Map de usuarios para búsqueda O(1) en lugar de O(n)
          const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

          members = membersData2.map(member => {
            const user = usersMap.get(member.user_id);
            return {
              ...member,
              users: user || {
                id: member.user_id,
                email: 'usuario@ejemplo.com',
                first_name: 'Usuario',
                last_name: 'Sin nombre',
                username: 'usuario',
                profile_picture_url: null,
                points: 0
              }
            };
          });
        }
      } else {
        members = membersData || [];
      }
    } catch (error) {
      members = [];
    }

    // Procesar datos de ligas
    const membersWithLeagues = members.map(member => {
      const points = member.users?.points || 0;
      let league = 'gold';
      
      if (points >= LEAGUE_SYSTEM.diamond.min) {
        league = 'diamond';
      } else if (points >= LEAGUE_SYSTEM.platinum.min) {
        league = 'platinum';
      }

      return {
        id: member.id,
        user_id: member.users.id,
        username: member.users.username || 'usuario',
        first_name: member.users.first_name,
        last_name: member.users.last_name,
        profile_picture_url: member.users.profile_picture_url,
        points: points,
        league: league,
        league_info: LEAGUE_SYSTEM[league as keyof typeof LEAGUE_SYSTEM],
        role: member.role,
        joined_at: member.joined_at
      };
    });

    // Ordenar por puntos (descendente)
    membersWithLeagues.sort((a, b) => b.points - a.points);

    // Asignar rangos
    const membersWithRanks = membersWithLeagues.map((member, index) => ({
      ...member,
      rank: index + 1,
      total_members: membersWithLeagues.length
    }));

    // Obtener estadísticas de ligas
    const leagueStats = {
      gold: membersWithRanks.filter(m => m.league === 'gold').length,
      platinum: membersWithRanks.filter(m => m.league === 'platinum').length,
      diamond: membersWithRanks.filter(m => m.league === 'diamond').length
    };

    // Obtener el usuario actual con su información de liga
    const currentUser = membersWithRanks.find(m => m.user_id === user.id);

    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        access_type: community.access_type
      },
      leagueSystem: LEAGUE_SYSTEM,
      pointsSystem: POINTS_SYSTEM,
      currentUser: currentUser || null,
      members: membersWithRanks,
      leagueStats,
      totalMembers: membersWithRanks.length
    });

  } catch (error) {
    logError('GET /api/communities/[slug]/leagues', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener datos de las ligas'),
      { status: 500 }
    );
  }
}
