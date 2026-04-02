import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import type { CommunityUserRow } from './adminCommunities.types'
import { communityMembersTable, communityUsersTable } from './adminCommunities.db'

function buildCommunityUserFallback(userId: string) {
  return {
    id: userId,
    display_name: 'Usuario no encontrado',
    first_name: 'Usuario',
    last_name: 'No encontrado',
    email: 'email@noencontrado.com',
    profile_picture_url: null,
    cargo_rol: 'Usuario'
  }
}

function buildCommunityUserMap(users: CommunityUserRow[] | null | undefined) {
  return new Map((users || []).map(user => [user.id, user]))
}

export class AdminCommunityMembersService {
  static async getCommunityMembers(communityId: string, page: number, limit: number): Promise<any[]>
  static async getCommunityMembers(communityId: string): Promise<Array<{ id: string, name: string, role: string, joined_at: string }>>
  static async getCommunityMembers(communityId: string, page?: number, limit?: number): Promise<any[]> {
    const supabase = await createClient()

    if (page !== undefined && limit !== undefined) {
      try {
        const { data: members, error } = await communityMembersTable(supabase)
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
          return []
        }

        const userIds = [...new Set(members.map(member => member.user_id))]
        const { data: users, error: usersError } = await communityUsersTable(supabase)
          .select('id, display_name, first_name, last_name, email, profile_picture_url, cargo_rol')
          .in('id', userIds)

        if (usersError) {
          logger.error('Error fetching users for members', { error: usersError.message, communityId })
          return members.map(member => ({
            ...member,
            users: buildCommunityUserFallback(member.user_id)
          }))
        }

        const usersById = buildCommunityUserMap(users)

        return members.map(member => {
          const user = usersById.get(member.user_id)
          const resolvedUser = user || buildCommunityUserFallback(member.user_id)

          return {
            ...member,
            name: resolvedUser.display_name ||
              `${resolvedUser.first_name || ''} ${resolvedUser.last_name || ''}`.trim() ||
              'Usuario no encontrado',
            users: resolvedUser
          }
        })
      } catch (error) {
        logger.error('Error in AdminCommunitiesService.getCommunityMembers', {
          error: error instanceof Error ? error.message : String(error),
          communityId
        })
        return []
      }
    }

    try {
      const { data: members, error } = await communityMembersTable(supabase)
        .select(`
          id,
          role,
          joined_at,
          user_id
        `)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        logger.error('Error fetching community members', { error: error.message, communityId })
        throw error
      }

      const activeMembers = members || []
      if (activeMembers.length === 0) {
        return []
      }

      const userIds = [...new Set(activeMembers.map(member => member.user_id))]
      const { data: users, error: usersError } = await communityUsersTable(supabase)
        .select('id, display_name, first_name, last_name')
        .in('id', userIds)

      if (usersError) {
        logger.error('Error fetching users for active community members', {
          error: usersError.message,
          communityId
        })
      }

      const usersById = buildCommunityUserMap(users)

      return activeMembers.map(member => {
        const user = usersById.get(member.user_id)

        return {
          id: member.id,
          name: user?.display_name ||
            `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
            'Usuario sin nombre',
          role: member.role,
          joined_at: member.joined_at
        }
      })
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityMembers', {
        error: error instanceof Error ? error.message : String(error),
        communityId
      })
      throw error
    }
  }
}
