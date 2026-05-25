export {
  checkHierarchicalAccess,
} from './hierarchical-auth/access';
export {
  determineDefaultScope,
  isRoleEqualOrHigher,
  ROLE_HIERARCHY,
} from './hierarchical-auth/roles';
export {
  buildHierarchyWhereClause,
} from './hierarchical-auth/where-clause';
export {
  canManageUser,
} from './hierarchical-auth/manage-user';
export {
  getAccessibleTeamIds,
} from './hierarchical-auth/teams';
export {
  loadHierarchyContext,
} from './hierarchical-auth/load-context';
export {
  requireHierarchicalAccess,
} from './hierarchical-auth/require-access';
export {
  requireHierarchyEnabled,
} from './hierarchical-auth/require-enabled';
export {
  requireHierarchyRole,
} from './hierarchical-auth/require-role';
export type {
  AccessCheckResult,
  HierarchyContext,
  HierarchyRole,
  HierarchyScope,
  ResourceScope,
} from './hierarchical-auth/types';
