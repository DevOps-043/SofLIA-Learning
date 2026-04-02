import { createClient } from '../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'
import { logger } from '../../../lib/logger'
import { AuditLogService } from './auditLog.service'
import {
  AdminCommunity,
  CommunityRow,
  CommunityStats,
  PaginationParams,
  PaginatedResponse,
  mapRowToAdminCommunity,
} from './adminCommunities.types'
import {
  communityAccessRequestsTable,
  communityCommentsTable,
  communityMembersTable,
  communityPostsTable,
  communityReactionsTable,
  communitiesTable,
  communityStatsTable,
  communityVideosTable,
} from './adminCommunities.db'

function mapCommunityRowToAdminCommunity(row: CommunityRow): AdminCommunity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    image_url: row.image_url || undefined,
    member_count: row.member_count || 0,
    is_active: row.is_active,
    visibility: row.visibility,
    access_type: row.access_type,
    course_id: row.course_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export class AdminCommunitiesCrudService {
  static async getAllCommunities(): Promise<AdminCommunity[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await communityStatsTable(supabase)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching communities', { error: error.message })
        throw error
      }

      return (data || []).map(mapRowToAdminCommunity)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getAllCommunities', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  static async getCommunitiesPaginated(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<AdminCommunity>> {
    const supabase = await createClient()
    const { limit = 20, cursor, search, visibility, isActive } = params

    try {
      let query = communityStatsTable(supabase)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (cursor) {
        const { data: cursorCommunity, error: cursorError } = await communitiesTable(supabase)
          .select('created_at')
          .eq('id', cursor)
          .single()

        if (cursorError) {
          logger.error('Error fetching cursor community', { cursor, error: cursorError.message })
        } else if (cursorCommunity) {
          query = query.lt('created_at', cursorCommunity.created_at)
        }
      }

      if (search && search.trim()) {
        const searchTerm = search.trim()
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (visibility) {
        query = query.eq('visibility', visibility)
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error, count } = await query.limit(limit + 1)

      if (error) {
        logger.error('Error fetching paginated communities', { error: error.message, params })
        throw error
      }

      const hasMore = (data?.length || 0) > limit
      const communities = hasMore ? (data || []).slice(0, limit) : (data || [])
      const nextCursor = hasMore && communities.length > 0
        ? communities[communities.length - 1].id
        : null

      return {
        data: communities.map(mapRowToAdminCommunity),
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
      const { data, error } = await communityStatsTable(supabase).select('*')

      if (error) {
        logger.error('Error fetching community stats', { error: error.message })
        throw error
      }

      return (data || []).reduce(
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
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityStats', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  static async createCommunity(
    communityData: Partial<AdminCommunity>,
    adminUserId: string,
    requestInfo?: { ip?: string, userAgent?: string }
  ): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      let slug: string

      if (communityData.slug) {
        slug = sanitizeSlug(communityData.slug)
      } else if (communityData.name) {
        slug = sanitizeSlug(communityData.name)
      } else {
        throw new Error('Se requiere nombre o slug para crear la comunidad')
      }

      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await communitiesTable(supabase)
          .select('slug')
          .eq('slug', testSlug)
          .single()

        return !!data
      })

      const { data, error } = await communitiesTable(supabase)
        .insert({
          name: communityData.name || '',
          description: communityData.description || '',
          slug,
          image_url: communityData.image_url || null,
          member_count: 0,
          is_active: communityData.is_active ?? true,
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

      if (error || !data) {
        logger.error('Error creating community', {
          message: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details
        })
        throw error || new Error('No se pudo crear la comunidad')
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'communities',
        record_id: data.id,
        old_values: undefined,
        new_values: communityData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return mapCommunityRowToAdminCommunity(data)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.createCommunity', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  static async updateCommunity(
    communityId: string,
    communityData: Partial<AdminCommunity>,
    adminUserId: string,
    requestInfo?: { ip?: string, userAgent?: string }
  ): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      const { data: oldData } = await communitiesTable(supabase)
        .select('*')
        .eq('id', communityId)
        .single()

      let slug = communityData.slug
      if (slug) {
        slug = sanitizeSlug(slug)

        slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
          const { data } = await communitiesTable(supabase)
            .select('slug')
            .eq('slug', testSlug)
            .neq('id', communityId)
            .single()

          return !!data
        })
      }

      const { data, error } = await communitiesTable(supabase)
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

      if (error || !data) {
        logger.error('Error updating community', { error: error?.message || 'Unknown error', communityId })
        throw error || new Error('No se pudo actualizar la comunidad')
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: oldData || undefined,
        new_values: communityData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return mapCommunityRowToAdminCommunity(data)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.updateCommunity', {
        error: error instanceof Error ? error.message : String(error),
        communityId
      })
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
      const { data: currentCommunity, error: fetchError } = await communitiesTable(supabase)
        .select('*')
        .eq('id', communityId)
        .single()

      if (fetchError || !currentCommunity) {
        throw new Error('Comunidad no encontrada')
      }

      const newActiveState = !currentCommunity.is_active

      const { data: updatedCommunity, error: updateError } = await communitiesTable(supabase)
        .update({
          is_active: newActiveState,
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

      if (updateError || !updatedCommunity) {
        throw new Error(`Error al actualizar visibilidad: ${updateError?.message || 'Unknown error'}`)
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: { is_active: currentCommunity.is_active },
        new_values: { is_active: newActiveState },
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return mapCommunityRowToAdminCommunity(updatedCommunity)
    } catch (error) {
      logger.error('Error toggling community visibility', {
        error: error instanceof Error ? error.message : String(error),
        communityId
      })
      throw error
    }
  }

  static async getCommunityBySlug(slug: string): Promise<AdminCommunity | null> {
    const supabase = await createClient()

    try {
      const { data: row, error } = await communityStatsTable(supabase)
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !row) {
        return null
      }

      return mapRowToAdminCommunity(row)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityBySlug', {
        error: error instanceof Error ? error.message : String(error),
        slug
      })
      return null
    }
  }

  static async deleteCommunity(
    communityId: string,
    adminUserId: string,
    requestInfo?: { ip?: string, userAgent?: string }
  ): Promise<void> {
    const supabase = await createClient()

    try {
      const { data: communityData } = await communitiesTable(supabase)
        .select('*')
        .eq('id', communityId)
        .single()

      await communityReactionsTable(supabase).delete().eq('post_id', communityId)
      await communityCommentsTable(supabase).delete().eq('community_id', communityId)
      await communityPostsTable(supabase).delete().eq('community_id', communityId)
      await communityVideosTable(supabase).delete().eq('community_id', communityId)
      await communityAccessRequestsTable(supabase).delete().eq('community_id', communityId)
      await communityMembersTable(supabase).delete().eq('community_id', communityId)

      const { error } = await communitiesTable(supabase).delete().eq('id', communityId)

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
        old_values: communityData || undefined,
        new_values: undefined,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.deleteCommunity', {
        error: error instanceof Error ? error.message : String(error),
        communityId
      })
      throw error
    }
  }
}
