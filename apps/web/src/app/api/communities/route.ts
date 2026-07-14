import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { cacheHeaders } from '../../../lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Validar variables de entorno primero
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('❌ Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor',
          message: 'Variables de entorno de Supabase no configuradas'
        }, 
        { status: 500 }
      );
    }

    const supabase = await createClient();
    
    logger.log('🔍 Fetching communities...');
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../features/auth/services/session.service');
    let user = null;
    try {
      user = await SessionService.getCurrentUser();
    } catch (userError) {
      logger.log('⚠️ Error getting user (continuing with public communities):', userError);
    }
    
    if (!user) {
      logger.log('⚠️ User not authenticated, showing public communities only');
    } else {
      logger.log('✅ User authenticated:', user.id);
    }

    // Obtener comunidades activas con campos explícitos y límite de seguridad
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, description, slug, thumbnail_url, banner_url, visibility, is_active, created_at, creator_id, member_count, category, rules')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200);

    if (communitiesError) {
      logger.error('❌ Error fetching communities:', {
        message: communitiesError.message,
        details: communitiesError.details,
        hint: communitiesError.hint,
        code: communitiesError.code
      });
      
      // Si el error es que la tabla no existe, retornar array vacío en lugar de error
      if (communitiesError.code === 'PGRST116' || communitiesError.message?.includes('does not exist')) {
        logger.log('⚠️ Communities table does not exist, returning empty array');
        return NextResponse.json({
          communities: [],
          total: 0
        }, { status: 200 });
      }
      
      return NextResponse.json(
        { 
          error: 'Error al obtener comunidades',
          message: communitiesError.message || 'Error desconocido'
        }, 
        { status: 500 }
      );
    }

    logger.log('📊 Found communities:', communities?.length || 0);
    
    // Si no hay comunidades, retornar array vacío (no es un error)
    if (!communities || communities.length === 0) {
      logger.log('⚠️ No communities found in database');
      return NextResponse.json({
        communities: [],
        total: 0
      }, { status: 200 });
    }

    // Si no hay usuario autenticado, retornar solo comunidades públicas
    if (!user) {
      const publicCommunities = communities
        ?.filter(community => community.visibility === 'public')
        .map(community => ({
          ...community,
          is_member: false,
          has_pending_request: false,
          user_role: null
        })) || [];

      logger.log('🌐 Returning public communities:', publicCommunities.length);
      
      // Importar utilidades de cache
      const { withCache, semiStaticCache } = await import('../../../core/utils/cache-headers');
      
      return withCache(
        NextResponse.json({
          communities: publicCommunities,
          total: publicCommunities.length
        }),
        semiStaticCache // Cache 5 min - comunidades públicas
      );
    }

    // Obtener el rol del usuario
    const userRole = user.platform_role;
    const isAdmin = userRole === 'Administrador';
    const isInstructor = userRole === 'Instructor';

    logger.log('👤 User role:', userRole, { isAdmin, isInstructor });

    // Obtener membresías y solicitudes pendientes en paralelo
    const [
      { data: memberships, error: membershipsError },
      { data: pendingRequests, error: requestsError }
    ] = await Promise.all([
      supabase
        .from('community_members')
        .select('community_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('community_access_requests')
        .select('community_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending'),
    ]);

    if (membershipsError) {
      logger.error('❌ Error fetching memberships:', membershipsError);
    }
    if (requestsError) {
      logger.error('❌ Error fetching pending requests:', requestsError);
    }

    // Crear mapas para búsqueda rápida
    const membershipMap = new Map(
      memberships?.map(m => [m.community_id, m.role]) || []
    );
    const pendingRequestsMap = new Set(
      pendingRequests?.map(r => r.community_id) || []
    );

    // Filtrar comunidades según el rol del usuario
    let filteredCommunities = communities;

    if (isAdmin) {
      // Administradores ven TODAS las comunidades activas
      logger.log('✅ Admin user - showing all communities');
      filteredCommunities = communities;
    } else if (isInstructor) {
      // Instructores ven solo:
      // 1. Comunidades que crearon (creator_id = user.id)
      // 2. Comunidades donde son admin o moderator en community_members
      logger.log('📚 Instructor user - filtering by creator/admin/moderator role');
      
      const adminOrModeratorCommunityIds = new Set(
        memberships
          ?.filter(m => m.role === 'admin' || m.role === 'moderator')
          .map(m => m.community_id) || []
      );

      filteredCommunities = communities.filter(community => {
        // Verificar si es el creador (puede ser null si no hay creador asignado)
        const isCreator = community.creator_id && community.creator_id === user.id;
        // Verificar si es admin o moderator en la comunidad
        const isAdminOrModerator = adminOrModeratorCommunityIds.has(community.id);
        return isCreator || isAdminOrModerator;
      });

      logger.log(`📊 Instructor can see ${filteredCommunities.length} of ${communities.length} communities`);
    } else {
      // Usuarios normales ven solo comunidades públicas
      logger.log('👤 Regular user - showing public communities only');
      filteredCommunities = communities.filter(
        community => community.visibility === 'public'
      );
    }

    // Enriquecer comunidades con información del usuario
    const enrichedCommunities = filteredCommunities.map(community => {
      // Lógica especial para "Profesionales" - siempre mostrar como miembro
      if (community.slug === 'profesionales') {
        // Verificar si el usuario tiene ALGUNA otra membresía
        const hasOtherMembership = Array.from(membershipMap.keys()).some(
          communityId => communityId !== community.id
        );
        
        if (!hasOtherMembership) {
          // Usuario sin otras comunidades: mostrar como miembro automático
          return {
            ...community,
            is_member: true,
            has_pending_request: false,
            user_role: 'member'
          };
        }
      }
      
      return {
        ...community,
        is_member: membershipMap.has(community.id),
        has_pending_request: pendingRequestsMap.has(community.id),
        user_role: membershipMap.get(community.id) || null
      };
    });

    logger.log(`✅ Returning ${enrichedCommunities.length} enriched communities for ${userRole}`);

    // Importar utilidades de cache
    const { withCache, privateCache } = await import('../../../core/utils/cache-headers');

    return withCache(
      NextResponse.json({
        communities: enrichedCommunities,
        total: enrichedCommunities.length
      }),
      privateCache // No cache - datos específicos del usuario autenticado
    );

  } catch (error) {
    logger.error('❌ Error in communities API:', error);
    
    // Si es un error conocido, devolver información más específica
    if (error instanceof Error) {
      // Si el error es sobre variables de entorno faltantes, ya lo manejamos arriba
      if (error.message.includes('Variables de entorno')) {
        return NextResponse.json(
          { 
            error: 'Error de configuración',
            message: error.message
          },
          { status: 500 }
        );
      }
      
      // Para otros errores, devolver mensaje genérico pero con logging detallado
      logger.error('❌ Unexpected error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'Ocurrió un error inesperado al obtener las comunidades'
      },
      { status: 500 }
    );
  }
}
