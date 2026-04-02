export { ROLE_DESCRIPTIONS, ROLE_HIERARCHY, ROLE_LABELS, SCOPE_LABELS } from './constants'
export { getHierarchyContext } from './context.service'
export {
  canAssignUsers,
  canManageHierarchy,
  canManageUser,
  canToggleHierarchy,
  checkAccess,
  isRoleEqualOrHigher,
} from './permissions'
export { applyHierarchyFilters, getAccessibleTeamIds } from './query-filters'
export { determineDefaultScope } from './scope'
export type {
  AccessResult,
  HierarchyContext,
  HierarchyRole,
  HierarchyScope,
  ResourceScope,
} from './types'
