import { AdminCommunityAccessRequestsService } from './adminCommunityAccessRequests.service'
import { AdminCommunitiesService } from './adminCommunities.service'
import { AdminCommunityContentService } from './adminCommunityContent.service'
import { AdminCommunityMembersService } from './adminCommunityMembers.service'
import type { AdminCommunityDetailPayload } from '../types/admin-community-detail.types'

export class AdminCommunityDetailServerService {
  static async getCommunityDetail(slug: string): Promise<AdminCommunityDetailPayload | null> {
    const community = await AdminCommunitiesService.getCommunityBySlug(slug)

    if (!community) {
      return null
    }

    const [posts, members, accessRequests, videos] = await Promise.all([
      AdminCommunityContentService.getCommunityPosts(community.id),
      AdminCommunityMembersService.getCommunityMembers(community.id, 1, 1000),
      AdminCommunityAccessRequestsService.getCommunityAccessRequests(community.id, 1, 1000),
      AdminCommunityContentService.getCommunityVideos(community.id, 1, 1000)
    ])

    return {
      community,
      posts,
      members,
      accessRequests,
      videos
    }
  }
}
