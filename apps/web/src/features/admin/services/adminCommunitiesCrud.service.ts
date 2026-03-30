import { createClient } from '../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'
import { logger } from '../../../lib/logger'
import { AuditLogService } from './auditLog.service'
import {
  AdminCommunity,
  CommunityStats,
  PaginationParams,
  PaginatedResponse,
  mapRowToAdminCommunity,
} from './adminCommunities.types'

export class AdminCommunitiesCrudService {
  static async getAllCommunities(): Promise<AdminCommunity[]> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Usar VIEW community_stats (1 query en lugar de N+1)
      const { data, error } = await supabase
        .from('community_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching communities', { error: error.message })
        throw error
      }

      return (data || []).map(mapRowToAdminCommunity)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getAllCommunities', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * ✅ ISSUE #19: Obtener comunidades con paginación cursor-based
   * Optimizado para manejar miles de comunidades sin degradar performance
   */
  static async getCommunitiesPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<AdminCommunity>> {
    const supabase = await createClient()
    const { limit = 20, cursor, search, visibility, isActive } = params

    try {
      // Construir query base desde la VIEW optimizada
      let query = supabase
        .from('community_stats')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit + 1)  // +1 para detectar si hay más páginas

      // ✅ Cursor-based pagination: buscar desde el último visto
      if (cursor) {
        const { data: cursorCommunity, error: cursorError } = await supabase
          .from('communities')
          .select('created_at')
          .eq('id', cursor)
          .single()

        if (cursorError) {
          logger.error('Error fetching cursor community', { cursor, error: cursorError.message })
        } else if (cursorCommunity) {
          // Obtener comunidades DESPUÉS del cursor
          query = query.lt('created_at', cursorCommunity.created_at)
        }
      }

      // ✅ Filtro de búsqueda por nombre o descripción
      if (search && search.trim()) {
        const searchTerm = search.trim()
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // ✅ Filtro por visibilidad (public, private)
      if (visibility) {
        query = query.eq('visibility', visibility)
      }

      // ✅ Filtro por estado activo
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error('Error fetching paginated communities', { error: error.message, params })
        throw error
      }

      // Verificar si hay más páginas
      const hasMore = (data?.length || 0) > limit
      const communities = hasMore ? (data || []).slice(0, limit) : (data || [])
      const nextCursor = hasMore && communities.length > 0
        ? communities[communities.length - 1].id
        : null

      return {
        data: communities.map((row: any) => mapRowToAdminCommunity(row)),
        nextCursor,
        hasMore,
        total: count || 0
      }
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunitiesPaginated', {
        error: error instanceof Error ? error.message : String(error),
        params
      })
      throw error
    }
  }

  static async getCommunityStats(): Promise<CommunityStats> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Usar VIEW community_stats para agregaciones
      const { data, error } = await supabase
        .from('community_stats')
        .select('*')

      if (error) {
        logger.error('Error fetching community stats', { error: error.message })
        throw error
      }

      const stats = (data || []).reduce(
        (acc, row) => ({
          totalCommunities: acc.totalCommunities + 1,
          activeCommunities: acc.activeCommunities + (row.is_active ? 1 : 0),
          totalMembers: acc.totalMembers + (row.members_count || 0),
          totalPosts: acc.totalPosts + (row.posts_count || 0),
          totalComments: acc.totalComments + (row.comments_count || 0),
          totalVideos: acc.totalVideos + (row.videos_count || 0),
          totalAccessRequests: acc.totalAccessRequests + (row.pending_requests_count || 0)
        }),
        {
          totalCommunities: 0,
          activeCommunities: 0,
          totalMembers: 0,
          totalPosts: 0,
          totalComments: 0,
          totalVideos: 0,
          totalAccessRequests: 0
        }
      )

      return stats
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityStats', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  static async createCommunity(communityData: Partial<AdminCommunity>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      logger.info('AdminCommunitiesService.createCommunity: Starting')

      // ✅ SEGURIDAD: Sanitizar y generar slug único
      let slug: string;

      if (communityData.slug) {
        slug = sanitizeSlug(communityData.slug);
      } else if (communityData.name) {
        slug = sanitizeSlug(communityData.name);
      } else {
        throw new Error('Se requiere nombre o slug para crear la comunidad');
      }

      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await supabase
          .from('communities')
          .select('slug')
          .eq('slug', testSlug)
          .single();
        return !!data;
      });

      logger.debug('Data to insert', {
        name: communityData.name,
        slug,
        visibility: communityData.visibility || 'public',
        access_type: communityData.access_type || 'open'
      })

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: communityData.name,
          description: communityData.description,
          slug,
          image_url: communityData.image_url,
          member_count: 0,
          is_active: communityData.is_active || true,
          visibility: communityData.visibility || 'public',
          access_type: communityData.access_type || 'open',
          course_id: communityData.course_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        logger.error('Error creating community', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }

      logger.info('Community created successfully', { communityId: data.id, slug: data.slug })

      try {
        await AuditLogService.logAction({
          user_id: adminUserId,
          admin_user_id: adminUserId,
          action: 'CREATE',
          table_name: 'communities',
          record_id: data.id,
          old_values: null,
          new_values: communityData,
          ip_address: requestInfo?.ip,
          user_agent: requestInfo?.userAgent
        })
        logger.info('Audit log registered')
      } catch (auditError) {
        logger.warn('Error in audit log (non-critical)', { error: auditError instanceof Error ? auditError.message : String(auditError) })
        // No lanzar error por problemas de auditoría
      }

      return data
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.createCommunity', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  static async updateCommunity(communityId: string, communityData: Partial<AdminCommunity>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      const { data: oldData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      // ✅ SEGURIDAD: Sanitizar slug si se proporciona
      let slug = communityData.slug;
      if (slug) {
        slug = sanitizeSlug(slug);

        slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
          const { data } = await supabase
            .from('communities')
            .select('slug')
            .eq('slug', testSlug)
            .neq('id', communityId)  // Excluir la comunidad actual
            .single();
          return !!data;
        });
      }

      const { data, error } = await supabase
        .from('communities')
        .update({
          name: communityData.name,
          description: communityData.description,
          slug,
          image_url: communityData.image_url,
          is_active: communityData.is_active,
          visibility: communityData.visibility,
          access_type: communityData.access_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        logger.error('Error updating community', { error: error.message, communityId })
        throw error
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: oldData,
        new_values: communityData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.updateCommunity', { error: error instanceof Error ? error.message : String(error), communityId })
      throw error
    }
  }

  static async toggleCommunityVisibility(
    communityId: string,
    adminUserId: string,
    requestInfo?: { ip?: string, userAgent?: string }
  ): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      const { data: currentCommunity, error: fetchError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      if (fetchError || !currentCommunity) {
        throw new Error('Comunidad no encontrada')
      }

      const newActiveState = !currentCommunity.is_active

      const { data: updatedCommunity, error: updateError } = await supabase
        .from('communities')
        .update({
          is_active: newActiveState,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Error al actualizar visibilidad: ${updateError.message}`)
      }

      await AuditLogService.logAction({
        user_id: null,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: { is_active: currentCommunity.is_active },
        new_values: { is_active: newActiveState },
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return updatedCommunity as AdminCommunity
    } catch (error) {
      logger.error('Error toggling community visibility', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  static async getCommunityBySlug(slug: string): Promise<AdminCommunity | null> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Usar VIEW community_stats (1 query en lugar de 6)
      const { data: row, error } = await supabase
        .from('community_stats')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !row) {
        return null
      }

      return mapRowToAdminCommunity(row)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityBySlug', { error: error instanceof Error ? error.message : String(error), slug })
      return null
    }
  }

  static async deleteCommunity(communityId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      const { data: communityData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      // Eliminar en cascada
      await supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', communityId)

      await supabase
        .from('community_comments')
        .delete()
        .eq('community_id', communityId)

      await supabase
        .from('community_posts')
        .delete()
        .eq('community_id', communityId)

      await supabase
        .from('community_videos')
        .delete()
        .eq('community_id', communityId)

      await supabase
        .from('community_access_requests')
        .delete()
        .eq('community_id', communityId)

      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)

      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

      if (error) {
        logger.error('Error deleting community', { error: error.message, communityId })
        throw error
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'DELETE',
        table_name: 'communities',
        record_id: communityId,
        old_values: communityData,
        new_values: null,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.deleteCommunity', { error: error instanceof Error ? error.message : String(error), communityId })
      throw error
    }
  }
}
