import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'

export class AdminCommunityMembersService {
  /**
   * Overload 1 (paginated): used by admin API routes that need pagination.
   * Returns full member objects including user details.
   */
  static async getCommunityMembers(communityId: string, page: number, limit: number): Promise<any[]>
  /**
   * Overload 2 (simple): used internally when only basic info is needed.
   */
  static async getCommunityMembers(communityId: string): Promise<Array<{ id: string, name: string, role: string, joined_at: string }>>
  static async getCommunityMembers(communityId: string, page?: number, limit?: number): Promise<any[]> {
    const supabase = await createClient()

    // Paginated variant
    if (page !== undefined && limit !== undefined) {
      try {
        const { data: members, error } = await supabase
          .from('community_members')
          .select(`
            id,
            role,
            joined_at,
            is_active,
            updated_at,
            user_id
          `)
          .eq('community_id', communityId)
          .order('joined_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)

        if (error) {
          logger.error('Error fetching community members', { error: error.message, communityId })
          return []
        }

        if (!members || members.length === 0) {
          logger.debug('No members found for community', { communityId })
          return []
        }

        const userIds = [...new Set(members.map(member => member.user_id))]

        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, email, profile_picture_url, cargo_rol')
          .in('id', userIds)

        if (usersError) {
          logger.error('Error fetching users for members', { error: usersError.message })
          return members.map(member => ({
            ...member,
            users: {
              id: member.user_id,
              display_name: 'Usuario no encontrado',
              first_name: 'Usuario',
              last_name: 'No encontrado',
              email: 'email@noencontrado.com',
              profile_picture_url: null,
              cargo_rol: 'Usuario'
            }
          }))
        }

        return members.map(member => {
          const user = users?.find(u => u.id === member.user_id)
          return {
            ...member,
            name: user?.display_name || `${user?.first_name} ${user?.last_name}` || 'Usuario no encontrado',
            users: user || {
              id: member.user_id,
              display_name: 'Usuario no encontrado',
              first_name: 'Usuario',
              last_name: 'No encontrado',
              email: 'email@noencontrado.com',
              profile_picture_url: null,
              cargo_rol: 'Usuario'
            }
          }
        })
      } catch (error) {
        logger.error('Error in AdminCommunitiesService.getCommunityMembers', { error: error instanceof Error ? error.message : String(error), communityId })
        return []
      }
    }

    // Simple variant (no pagination)
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          id,
          role,
          joined_at,
          users!inner(display_name, first_name, last_name)
        `)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        logger.error('Error fetching community members', { error: error.message, communityId })
        throw error
      }

      return (data || []).map(member => ({
        id: member.id,
        name: member.users?.display_name ||
              `${member.users?.first_name || ''} ${member.users?.last_name || ''}`.trim() ||
              'Usuario sin nombre',
        role: member.role,
        joined_at: member.joined_at
      }))
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityMembers', { error: error instanceof Error ? error.message : String(error), communityId })
      throw error
    }
  }
}
