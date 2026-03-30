/**
 * adminCommunities.service.ts
 *
 * Backward-compatible barrel that re-exports everything from the split service files
 * and reassembles the original AdminCommunitiesService class so all existing imports
 * continue to work without any changes.
 */

// --- Types ---
export type {
  AdminCommunity,
  CommunityStats,
  PaginationParams,
  PaginatedResponse,
} from './adminCommunities.types'
export { mapRowToAdminCommunity } from './adminCommunities.types'

// --- Sub-services (available for direct import if needed) ---
export { AdminCommunitiesCrudService } from './adminCommunitiesCrud.service'
export { AdminCommunityMembersService } from './adminCommunityMembers.service'
export { AdminCommunityAccessRequestsService } from './adminCommunityAccessRequests.service'
export { AdminCommunityContentService } from './adminCommunityContent.service'

// --- Imports needed to rebuild the unified class ---
import { AdminCommunitiesCrudService } from './adminCommunitiesCrud.service'
import { AdminCommunityMembersService } from './adminCommunityMembers.service'
import { AdminCommunityAccessRequestsService } from './adminCommunityAccessRequests.service'
import { AdminCommunityContentService } from './adminCommunityContent.service'

/**
 * Unified service class preserved for backward compatibility.
 * All methods delegate to the focused sub-service classes.
 */
export class AdminCommunitiesService {
  // --- CRUD ---
  static getAllCommunities = AdminCommunitiesCrudService.getAllCommunities.bind(AdminCommunitiesCrudService)
  static getCommunitiesPaginated = AdminCommunitiesCrudService.getCommunitiesPaginated.bind(AdminCommunitiesCrudService)
  static getCommunityStats = AdminCommunitiesCrudService.getCommunityStats.bind(AdminCommunitiesCrudService)
  static createCommunity = AdminCommunitiesCrudService.createCommunity.bind(AdminCommunitiesCrudService)
  static updateCommunity = AdminCommunitiesCrudService.updateCommunity.bind(AdminCommunitiesCrudService)
  static toggleCommunityVisibility = AdminCommunitiesCrudService.toggleCommunityVisibility.bind(AdminCommunitiesCrudService)
  static getCommunityBySlug = AdminCommunitiesCrudService.getCommunityBySlug.bind(AdminCommunitiesCrudService)
  static deleteCommunity = AdminCommunitiesCrudService.deleteCommunity.bind(AdminCommunitiesCrudService)

  // --- Members ---
  static getCommunityMembers = AdminCommunityMembersService.getCommunityMembers.bind(AdminCommunityMembersService)

  // --- Access requests ---
  static getCommunityAccessRequests = AdminCommunityAccessRequestsService.getCommunityAccessRequests.bind(AdminCommunityAccessRequestsService)

  // --- Content (videos & posts) ---
  static getCommunityVideos = AdminCommunityContentService.getCommunityVideos.bind(AdminCommunityContentService)
  static getCommunityPosts = AdminCommunityContentService.getCommunityPosts.bind(AdminCommunityContentService)
}
