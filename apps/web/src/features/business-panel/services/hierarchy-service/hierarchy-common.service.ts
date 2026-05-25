import {
  assignCoursesToEntity,
  getEntityAssignments,
  getEntityCourses,
  getVisualAnalytics,
} from './hierarchy-common/hierarchy-analytics.service'
import {
  disableHierarchy,
  enableHierarchy,
  getConfig,
  getStats,
  seedDefaultStructure,
  updateConfig,
} from './hierarchy-common/hierarchy-config.service'
import {
  getFullHierarchy,
  getHierarchySummary,
} from './hierarchy-common/hierarchy-tree.service'
import {
  assignUserToNode,
  getAvailableUsersForNode,
  getNodeDetails,
  getNodeMembers,
  removeUserFromNode,
  searchOrganizationUsers,
} from './hierarchy-common/hierarchy-nodes.service'
import {
  canEnableHierarchy,
  isRegionNameAvailable,
  isTeamNameAvailable,
  isZoneNameAvailable,
} from './hierarchy-common/hierarchy-validation.service'

export { fetchApi, getApiBase } from './hierarchy-common/hierarchy-api'
export type { ApiResponse } from './hierarchy-common/hierarchy-common.types'

export class HierarchyCommonService {
  static getConfig = getConfig
  static updateConfig = updateConfig
  static enableHierarchy = enableHierarchy
  static disableHierarchy = disableHierarchy
  static seedDefaultStructure = seedDefaultStructure
  static getStats = getStats
  static getVisualAnalytics = getVisualAnalytics
  static getEntityCourses = getEntityCourses
  static getEntityAssignments = getEntityAssignments
  static assignCoursesToEntity = assignCoursesToEntity
  static getFullHierarchy = getFullHierarchy
  static getHierarchySummary = getHierarchySummary
  static canEnableHierarchy = canEnableHierarchy
  static isRegionNameAvailable = isRegionNameAvailable
  static isZoneNameAvailable = isZoneNameAvailable
  static isTeamNameAvailable = isTeamNameAvailable
  static getNodeDetails = getNodeDetails
  static getNodeMembers = getNodeMembers
  static assignUserToNode = assignUserToNode
  static removeUserFromNode = removeUserFromNode
  static getAvailableUsersForNode = getAvailableUsersForNode
  static searchOrganizationUsers = searchOrganizationUsers
}
