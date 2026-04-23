import { CommunityRecord } from './types'

export function buildEmptyMembersResponse(community: CommunityRecord) {
  return {
    community: {
      id: community.id,
      name: community.name,
      slug: community.slug,
      access_type: community.access_type,
    },
    members: [],
    total: 0,
  }
}
