import { AdminCommunity, CommunityStats } from '../../admin/services/adminCommunities.service'

export interface InstructorCommunity extends AdminCommunity {}

export interface InstructorCommunityStats extends CommunityStats {}

export class InstructorCommunitiesService {
  static async getCommunities(): Promise<InstructorCommunity[]> {
    try {
      const response = await fetch('/api/instructor/communities', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch communities')
      }

      const data = await response.json()
      return data.communities || []
    } catch (error) {
      throw error
    }
  }

  static async getCommunityStats(): Promise<InstructorCommunityStats> {
    try {
      const response = await fetch('/api/instructor/communities/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch community stats')
      }

      const data = await response.json()
      return data.stats
    } catch (error) {
      throw error
    }
  }
}

