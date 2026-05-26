import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { formatApiError, logError } from '@/core/utils/api-errors';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

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

    // Obtener la comunidad por slug primero para verificar su tipo de acceso
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, slug, access_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }



    // Intentar obtener miembros reales de la base de datos
    let members = [];
    
    try {
      // Primero intentar con la relación directa
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
            linkedin_url,
            github_url,
            website_url,
            bio,
            location,
            created_at,
            points,
            profile_visibility
          )
        `)
        .eq('community_id', community.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) {
        // Si falla el join, intentar obtener miembros por community_id directamente
        const { data: membersData2, error: membersError2 } = await supabase
          .from('community_members')
          .select(SELECT_COLUMNS.community_members)
          .eq('community_id', community.id)
          .eq('is_active', true);

        if (membersError2) {
          throw new Error('No se pudo acceder a la tabla community_members');
        }

        // Si tenemos datos pero sin join, obtener información de usuarios por separado
        if (membersData2 && membersData2.length > 0) {
          const userIds = membersData2.map(m => m.user_id);
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, username, profile_picture_url, linkedin_url, github_url, website_url, bio, location, created_at, points, profile_visibility')
            .in('id', userIds);

          if (usersError) {
            throw new Error('No se pudo obtener información de usuarios');
          }

          // Combinar datos de miembros y usuarios
          members = membersData2.map(member => {
            const user = usersData?.find(u => u.id === member.user_id);
            return {
              ...member,
              users: user || {
                id: member.user_id,
                email: 'usuario@ejemplo.com',
                first_name: 'Usuario',
                last_name: 'Sin nombre',
                username: 'usuario',
                profile_picture_url: null,
                linkedin_url: null,
                github_url: null,
                website_url: null,
                bio: null,
                location: null,
                created_at: new Date().toISOString(),
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

    // Si no hay miembros reales, retornar array vacío
    if (members.length === 0) {
      return NextResponse.json({
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
          access_type: community.access_type
        },
        members: [],
        total: 0
      });
    }

    // 🚀 OPTIMIZACIÓN: Lógica especial para "Profesionales" con una sola query
    if (community.slug === 'profesionales') {
      // Obtener todos los user_ids de los miembros actuales
      const memberUserIds = members.map(m => m.user_id || m.users.id);

      // Una sola query para obtener TODOS los usuarios que tienen otras comunidades
      const { data: usersWithOtherCommunities, error: membershipError } = await supabase
        .from('community_members')
        .select('user_id')
        .in('user_id', memberUserIds)
        .eq('is_active', true)
        .neq('community_id', community.id);

      if (membershipError) {
        techDebtLogger.error('Error checking user memberships:', membershipError);
      }

      // Crear un Set de user_ids que tienen otras comunidades (búsqueda O(1))
      const usersWithOtherCommunitiesSet = new Set(
        usersWithOtherCommunities?.map(m => m.user_id) || []
      );

      // Filtrar miembros: solo incluir los que NO están en el Set
      const validMembers = members.filter(member => {
        const userId = member.user_id || member.users.id;
        const hasOtherCommunities = usersWithOtherCommunitiesSet.has(userId);

        if (hasOtherCommunities) {

        }

        return !hasOtherCommunities;
      });

      // Reemplazar con solo los miembros válidos
      members = validMembers;

      // Si no quedan miembros válidos después del filtrado
      if (members.length === 0) {
        return NextResponse.json({
          community: {
            id: community.id,
            name: community.name,
            slug: community.slug,
            access_type: community.access_type
          },
          members: [],
          total: 0
        });
      }
    }

    // 🚀 OPTIMIZACIÓN: Obtener todas las estadísticas con queries agregadas en paralelo
    const memberUserIds = members.map(m => m.user_id || m.users.id);

    // Ejecutar TODAS las queries de estadísticas en paralelo (1 query por tipo de stat)
    const [postsData, commentsData, reactionsGivenData, reactionsReceivedData] = await Promise.all([
      // Posts por usuario en esta comunidad
      supabase
        .from('community_posts')
        .select('user_id')
        .eq('community_id', community.id)
        .in('user_id', memberUserIds),

      // Comentarios por usuario en esta comunidad
      supabase
        .from('community_comments')
        .select('user_id')
        .eq('community_id', community.id)
        .in('user_id', memberUserIds),

      // Reacciones dadas por usuario
      supabase
        .from('community_reactions')
        .select('user_id')
        .in('user_id', memberUserIds),

      // Reacciones recibidas: posts del usuario que tienen reacciones
      supabase
        .from('community_posts')
        .select('user_id, community_reactions(id)')
        .eq('community_id', community.id)
        .in('user_id', memberUserIds)
    ]);

    // Crear Maps para contar estadísticas por usuario (búsqueda O(1))
    const postsCountMap = new Map<string, number>();
    const commentsCountMap = new Map<string, number>();
    const reactionsGivenMap = new Map<string, number>();
    const reactionsReceivedMap = new Map<string, number>();

    // Contar posts por usuario
    postsData.data?.forEach(post => {
      postsCountMap.set(post.user_id, (postsCountMap.get(post.user_id) || 0) + 1);
    });

    // Contar comentarios por usuario
    commentsData.data?.forEach(comment => {
      commentsCountMap.set(comment.user_id, (commentsCountMap.get(comment.user_id) || 0) + 1);
    });

    // Contar reacciones dadas por usuario
    reactionsGivenData.data?.forEach(reaction => {
      reactionsGivenMap.set(reaction.user_id, (reactionsGivenMap.get(reaction.user_id) || 0) + 1);
    });

    // Contar reacciones recibidas por usuario
    reactionsReceivedData.data?.forEach((post: Record<string, unknown>) => {
      if (post.community_reactions && Array.isArray(post.community_reactions)) {
        const count = post.community_reactions.length;
        reactionsReceivedMap.set(
          post.user_id,
          (reactionsReceivedMap.get(post.user_id) || 0) + count
        );
      }
    });

    // Construir array de miembros con sus estadísticas (sin queries adicionales)
    const membersWithStats = members.map(member => {
      const userId = member.user_id || member.users.id;

      // Obtener estadísticas de los Maps (O(1) lookup)
      const stats = {
        posts_count: postsCountMap.get(userId) || 0,
        comments_count: commentsCountMap.get(userId) || 0,
        reactions_given: reactionsGivenMap.get(userId) || 0,
        reactions_received: reactionsReceivedMap.get(userId) || 0,
        points: member.users?.points || 0 // Ya tenemos los puntos del JOIN inicial
      };

      return {
        id: member.id,
        role: member.role,
        joined_at: member.joined_at,
        user: {
          id: member.users.id,
          email: member.users.email,
          first_name: member.users.first_name,
          last_name: member.users.last_name,
          username: member.users.username,
          profile_picture_url: member.users.profile_picture_url,
          linkedin_url: member.users.linkedin_url,
          github_url: member.users.github_url,
          portfolio_url: member.users.website_url, // Usar website_url como portafolio
          bio: member.users.bio,
          location: member.users.location,
          created_at: member.users.created_at,
          profile_visibility: member.users.profile_visibility || 'public'
        },
        stats
      };
    });

    // Ordenar por puntos (descendente) y luego por fecha de unión
    membersWithStats.sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

    // Asignar rangos
    const membersWithRanks = membersWithStats.map((member, index) => ({
      ...member,
      rank: index + 1,
      total_members: membersWithStats.length
    }));

    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        access_type: community.access_type
      },
      members: membersWithRanks,
      total: membersWithRanks.length
    });

  } catch (error) {
    logError('GET /api/communities/[slug]/members', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener miembros de la comunidad'),
      { status: 500 }
    );
  }
}

// PATCH endpoint para limpiar membresías inválidas en "Profesionales"
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // Verificar autenticación
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo permitir limpieza en "Profesionales"
    if (slug !== 'profesionales') {
      return NextResponse.json({
        error: 'Esta operación solo está disponible para la comunidad Profesionales'
      }, { status: 400 });
    }

    // Verificar que el usuario es admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Se requieren permisos de administrador' }, { status: 403 });
    }

    // Obtener la comunidad "Profesionales"
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Obtener todos los miembros actuales de "Profesionales"
    const { data: allMembers, error: membersError } = await supabase
      .from('community_members')
      .select('id, user_id')
      .eq('community_id', community.id)
      .eq('is_active', true);

    if (membersError) {
      return NextResponse.json({
        error: 'Error al obtener miembros'
      }, { status: 500 });
    }

    if (!allMembers || allMembers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay miembros para limpiar',
        removed: 0,
        valid_members: 0
      });
    }

    // Verificar cada miembro y marcar inválidos
    const invalidMemberIds: string[] = [];

    for (const member of allMembers) {
      // Verificar si tiene otras comunidades activas (excluyendo Profesionales)
      const { data: otherMemberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', member.user_id)
        .eq('is_active', true)
        .neq('community_id', community.id);

      // Si tiene otras comunidades, marcarlo como inválido
      if (otherMemberships && otherMemberships.length > 0) {
        invalidMemberIds.push(member.id);

      }
    }

    // Remover membresías inválidas
    let removedCount = 0;
    if (invalidMemberIds.length > 0) {
      const { error: removeError } = await supabase
        .from('community_members')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', invalidMemberIds);

      if (removeError) {
        return NextResponse.json({
          error: 'Error al remover membresías inválidas'
        }, { status: 500 });
      }

      removedCount = invalidMemberIds.length;
    }

    // Calcular y actualizar el member_count correcto
    const validMemberCount = allMembers.length - removedCount;

    const { error: updateCountError } = await supabase
      .from('communities')
      .update({
        member_count: validMemberCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', community.id);

    if (updateCountError) {
      return NextResponse.json({
        error: 'Error al actualizar contador de miembros'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Limpieza completada exitosamente',
      removed: removedCount,
      valid_members: validMemberCount,
      total_checked: allMembers.length
    });

  } catch (error) {
    logError('PATCH /api/communities/[slug]/members', error);
    return NextResponse.json(
      formatApiError(error, 'Error al limpiar membresías'),
      { status: 500 }
    );
  }
}
