import type {
  UpdateProfileRequest,
  UserProfile,
  UserSubscription,
} from '../types/profile.types'
import { getProfile } from './profile-server/profile-query.service'
import { getOrganizationUserStats, getUserStats } from './profile-server/profile-stats.service'
import { getUserSubscriptions } from './profile-server/profile-subscriptions.service'
import { updateProfile } from './profile-server/profile-update.service'

export class ProfileServerService {
  static getProfile(userId: string, organizationId?: string | null): Promise<UserProfile> {
    return getProfile(userId, organizationId)
  }

  static updateProfile(
    userId: string,
    updates: UpdateProfileRequest,
    organizationId?: string | null,
  ): Promise<UserProfile> {
    return updateProfile(userId, updates, organizationId)
  }

  static getUserStats(userId: string, organizationId?: string | null): Promise<{
    completedCourses: number
    completedLessons: number
    certificates: number
    coursesInProgress: number
  }> {
    if (organizationId) {
      return getOrganizationUserStats(userId, organizationId)
    }

    return getUserStats(userId)
  }

  static getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return getUserSubscriptions(userId)
  }
}
