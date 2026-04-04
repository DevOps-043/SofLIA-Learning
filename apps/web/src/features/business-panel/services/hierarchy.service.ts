// Barrel re-export — all logic lives in sub-files
export * from './hierarchy-service'

import { HierarchyCommonService, type ApiResponse } from './hierarchy-service/hierarchy-common.service'
import { HierarchyRegionsService } from './hierarchy-service/hierarchy-regions.service'
import { HierarchyZonesService } from './hierarchy-service/hierarchy-zones.service'
import { HierarchyTeamsService } from './hierarchy-service/hierarchy-teams.service'
import type {
  Region,
  Zone,
  Team,
  HierarchyStats,
  HierarchyAnalytics,
  HierarchyConfig,
  CreateRegionRequest,
  UpdateRegionRequest,
  CreateZoneRequest,
  UpdateZoneRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  AssignUserToTeamRequest,
  AssignZoneManagerRequest,
  AssignRegionalManagerRequest,
  HierarchyTree,
  SeedHierarchyResponse,
  ListRegionsOptions,
  ListZonesOptions,
  ListTeamsOptions,
  UserWithHierarchy,
  HierarchyCourse,
} from '../types/hierarchy.types'

/**
 * Unified facade — preserves the original class name so all existing
 * imports continue to work without changes.
 */
export class HierarchyService {
  // Config & control
  static getConfig(orgSlug?: string): Promise<HierarchyConfig | null> {
    return HierarchyCommonService.getConfig(orgSlug)
  }
  static updateConfig(config: Partial<HierarchyConfig>, orgSlug?: string): Promise<ApiResponse<HierarchyConfig>> {
    return HierarchyCommonService.updateConfig(config, orgSlug)
  }
  static enableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return HierarchyCommonService.enableHierarchy(orgSlug)
  }
  static disableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return HierarchyCommonService.disableHierarchy(orgSlug)
  }
  static seedDefaultStructure(orgSlug?: string): Promise<ApiResponse<SeedHierarchyResponse>> {
    return HierarchyCommonService.seedDefaultStructure(orgSlug)
  }
  static getStats(orgSlug?: string): Promise<HierarchyStats | null> {
    return HierarchyCommonService.getStats(orgSlug)
  }
  static getVisualAnalytics(entityType: 'region' | 'zone' | 'team', entityId: string, orgSlug?: string): Promise<HierarchyAnalytics | null> {
    return HierarchyCommonService.getVisualAnalytics(entityType, entityId, orgSlug)
  }
  static getEntityCourses(entityType: 'region' | 'zone' | 'team', entityId: string, orgSlug?: string): Promise<HierarchyCourse[]> {
    return HierarchyCommonService.getEntityCourses(entityType, entityId, orgSlug)
  }
  static getEntityAssignments(entityType: 'region' | 'zone' | 'team', entityId: string, orgSlug?: string) {
    return HierarchyCommonService.getEntityAssignments(entityType, entityId, orgSlug)
  }
  static assignCoursesToEntity(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    courseIds: string[],
    options?: { start_date?: string; due_date?: string; approach?: 'fast' | 'balanced' | 'long' | 'custom'; message?: string },
    orgSlug?: string,
  ) {
    return HierarchyCommonService.assignCoursesToEntity(entityType, entityId, courseIds, options, orgSlug)
  }

  // Regions
  static getRegions(options?: ListRegionsOptions, orgSlug?: string): Promise<Region[]> {
    return HierarchyRegionsService.getRegions(options, orgSlug)
  }
  static getRegion(regionId: string, orgSlug?: string): Promise<Region | null> {
    return HierarchyRegionsService.getRegion(regionId, orgSlug)
  }
  static createRegion(data: CreateRegionRequest, orgSlug?: string): Promise<ApiResponse<Region>> {
    return HierarchyRegionsService.createRegion(data, orgSlug)
  }
  static updateRegion(regionId: string, data: UpdateRegionRequest, orgSlug?: string): Promise<ApiResponse<Region>> {
    return HierarchyRegionsService.updateRegion(regionId, data, orgSlug)
  }
  static deleteRegion(regionId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return HierarchyRegionsService.deleteRegion(regionId, orgSlug)
  }

  // Zones
  static getZones(options?: ListZonesOptions, orgSlug?: string): Promise<Zone[]> {
    return HierarchyZonesService.getZones(options, orgSlug)
  }
  static getZone(zoneId: string, orgSlug?: string): Promise<Zone | null> {
    return HierarchyZonesService.getZone(zoneId, orgSlug)
  }
  static createZone(data: CreateZoneRequest, orgSlug?: string): Promise<ApiResponse<Zone>> {
    return HierarchyZonesService.createZone(data, orgSlug)
  }
  static updateZone(zoneId: string, data: UpdateZoneRequest, orgSlug?: string): Promise<ApiResponse<Zone>> {
    return HierarchyZonesService.updateZone(zoneId, data, orgSlug)
  }
  static deleteZone(zoneId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return HierarchyZonesService.deleteZone(zoneId, orgSlug)
  }

  // Teams
  static getTeams(options?: ListTeamsOptions, orgSlug?: string): Promise<Team[]> {
    return HierarchyTeamsService.getTeams(options, orgSlug)
  }
  static getTeam(teamId: string, orgSlug?: string): Promise<Team | null> {
    return HierarchyTeamsService.getTeam(teamId, orgSlug)
  }
  static createTeam(data: CreateTeamRequest, orgSlug?: string): Promise<ApiResponse<Team>> {
    return HierarchyTeamsService.createTeam(data, orgSlug)
  }
  static updateTeam(teamId: string, data: UpdateTeamRequest, orgSlug?: string): Promise<ApiResponse<Team>> {
    return HierarchyTeamsService.updateTeam(teamId, data, orgSlug)
  }
  static deleteTeam(teamId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return HierarchyTeamsService.deleteTeam(teamId, orgSlug)
  }
  static getTeamMembers(teamId: string, orgSlug?: string): Promise<UserWithHierarchy[]> {
    return HierarchyTeamsService.getTeamMembers(teamId, orgSlug)
  }

  // User assignment
  static assignUserToTeam(data: AssignUserToTeamRequest, orgSlug?: string): Promise<ApiResponse<UserWithHierarchy>> {
    return HierarchyTeamsService.assignUserToTeam(data, orgSlug)
  }
  static removeUserFromTeam(userId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return HierarchyTeamsService.removeUserFromTeam(userId, orgSlug)
  }
  static assignZoneManager(data: AssignZoneManagerRequest, orgSlug?: string): Promise<ApiResponse<UserWithHierarchy>> {
    return HierarchyTeamsService.assignZoneManager(data, orgSlug)
  }
  static assignRegionalManager(data: AssignRegionalManagerRequest, orgSlug?: string): Promise<ApiResponse<UserWithHierarchy>> {
    return HierarchyTeamsService.assignRegionalManager(data, orgSlug)
  }
  static getUnassignedUsers(orgSlug?: string): Promise<UserWithHierarchy[]> {
    return HierarchyTeamsService.getUnassignedUsers(orgSlug)
  }
  static getUsersWithHierarchy(orgSlug?: string): Promise<UserWithHierarchy[]> {
    return HierarchyTeamsService.getUsersWithHierarchy(orgSlug)
  }
  static getAvailableManagers(role?: 'regional_manager' | 'zone_manager' | 'team_leader', orgSlug?: string): Promise<UserWithHierarchy[]> {
    return HierarchyTeamsService.getAvailableManagers(role, orgSlug)
  }

  // Full hierarchy
  static getFullHierarchy(orgSlug?: string): Promise<HierarchyTree> {
    return HierarchyCommonService.getFullHierarchy(orgSlug)
  }
  static getHierarchySummary(orgSlug?: string) {
    return HierarchyCommonService.getHierarchySummary(orgSlug)
  }

  // Validations
  static canEnableHierarchy(orgSlug?: string): Promise<{ canEnable: boolean; issues: string[] }> {
    return HierarchyCommonService.canEnableHierarchy(orgSlug)
  }
  static isRegionNameAvailable(name: string, orgSlug?: string): Promise<boolean> {
    return HierarchyCommonService.isRegionNameAvailable(name, orgSlug)
  }
  static isZoneNameAvailable(name: string, regionId: string, orgSlug?: string): Promise<boolean> {
    return HierarchyCommonService.isZoneNameAvailable(name, regionId, orgSlug)
  }
  static isTeamNameAvailable(name: string, zoneId: string, orgSlug?: string): Promise<boolean> {
    return HierarchyCommonService.isTeamNameAvailable(name, zoneId, orgSlug)
  }

  // Nodes (V2)
  static getNodeDetails(nodeId: string, orgSlug?: string) {
    return HierarchyCommonService.getNodeDetails(nodeId, orgSlug)
  }
  static getNodeMembers(nodeId: string, orgSlug?: string) {
    return HierarchyCommonService.getNodeMembers(nodeId, orgSlug)
  }
  static assignUserToNode(nodeId: string, userId: string, role?: string, isPrimary?: boolean, orgSlug?: string) {
    return HierarchyCommonService.assignUserToNode(nodeId, userId, role, isPrimary, orgSlug)
  }
  static removeUserFromNode(nodeId: string, userId: string, orgSlug?: string) {
    return HierarchyCommonService.removeUserFromNode(nodeId, userId, orgSlug)
  }
  static getAvailableUsersForNode(nodeId: string, query?: string, includeCurrentMembers?: boolean, orgSlug?: string) {
    return HierarchyCommonService.getAvailableUsersForNode(nodeId, query, includeCurrentMembers, orgSlug)
  }
  static searchOrganizationUsers(query?: string, orgSlug?: string) {
    return HierarchyCommonService.searchOrganizationUsers(query, orgSlug)
  }
}

// Default export preserved for backward compatibility
export default HierarchyService
