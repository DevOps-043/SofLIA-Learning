import type { BusinessUser } from '../../businessUsers.service'
import type { OrganizationRole, OrganizationStatus } from '../types'

export function normalizeOrganizationRole(
  role: string | null | undefined,
): OrganizationRole {
  return role === 'owner' || role === 'admin' || role === 'member'
    ? role
    : 'member'
}

export function normalizeOrganizationStatus(
  status: string | null | undefined,
): OrganizationStatus {
  return (
    status === 'active' ||
    status === 'invited' ||
    status === 'suspended' ||
    status === 'removed'
  )
    ? status
    : 'active'
}

export function shouldAutoAssignToDefaultTeam(
  role: BusinessUser['org_role'] | undefined,
): boolean {
  return normalizeOrganizationRole(role) === 'member'
}

export function hasHierarchyAutoAssignEnabled(
  config: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(config?.auto_assign_new_users)
}
