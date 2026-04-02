import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import { communityAccessRequestsTable, communityUsersTable } from './adminCommunities.db'

export class AdminCommunityAccessRequestsService {
  static async getCommunityAccessRequests(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      const { data: requests, error } = await communityAccessRequestsTable(supabase)
        .select(`
          id,
          status,
          note,
          created_at,
          reviewed_at,
          requester_id,
          reviewed_by
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        logger.error('Error fetching access requests', { error: error.message, communityId })
        return []
      }

      if (!requests || requests.length === 0) {
        return []
      }

      const requesterIds = [...new Set(requests.map(request => request.requester_id))]
      const reviewerIds = [...new Set(
        requests
          .map(request => request.reviewed_by)
          .filter((reviewedBy): reviewedBy is string => typeof reviewedBy === 'string' && reviewedBy.length > 0)
      )]
      const allUserIds = [...new Set([...requesterIds, ...reviewerIds])]

      const { data: users, error: usersError } = await communityUsersTable(supabase)
        .select('id, display_name, first_name, last_name, email, profile_picture_url')
        .in('id', allUserIds)

      if (usersError) {
        logger.error('Error fetching users for requests', { error: usersError.message, communityId })
        return requests.map(request => ({ ...request, requester: null, reviewer: null }))
      }

      const usersById = new Map((users || []).map(user => [user.id, user]))

      return requests.map(request => ({
        ...request,
        requester: usersById.get(request.requester_id) || null,
        reviewer: request.reviewed_by ? usersById.get(request.reviewed_by) || null : null
      }))
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityAccessRequests', {
        error: error instanceof Error ? error.message : String(error),
        communityId
      })
      return []
    }
  }
}
