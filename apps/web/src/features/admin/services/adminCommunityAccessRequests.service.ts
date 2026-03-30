import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'

export class AdminCommunityAccessRequestsService {
  static async getCommunityAccessRequests(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      const { data: requests, error } = await supabase
        .from('community_access_requests')
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

      const requesterIds = [...new Set(requests.map(req => req.requester_id))]
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(Boolean))]
      const allUserIds = [...new Set([...requesterIds, ...reviewerIds])]

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, email, profile_picture_url')
        .in('id', allUserIds)

      if (usersError) {
        logger.error('Error fetching users for requests', { error: usersError.message })
        return requests.map(request => ({ ...request, requester: null, reviewer: null }))
      }

      return requests.map(request => {
        const requester = users?.find(u => u.id === request.requester_id)
        const reviewer = users?.find(u => u.id === request.reviewed_by)
        return {
          ...request,
          requester: requester || null,
          reviewer: reviewer || null
        }
      })
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityAccessRequests', { error: error instanceof Error ? error.message : String(error), communityId })
      return []
    }
  }
}
