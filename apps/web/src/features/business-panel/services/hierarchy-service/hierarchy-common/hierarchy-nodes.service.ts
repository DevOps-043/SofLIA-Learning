import type { NodeDetails } from '../../../types/dynamicHierarchy.types'
import type { NodeMember, UserWithHierarchy } from '../../../types/hierarchy.types'
import { fetchApi } from './hierarchy-api'
import type { ApiResponse, NodeUser } from './hierarchy-common.types'

export async function getNodeDetails(nodeId: string, orgSlug?: string): Promise<NodeDetails | null> {
  const result = await fetchApi<NodeDetails>(`/nodes/${nodeId}`, {}, orgSlug)
  return result.success ? result.data ?? null : null
}

export async function getNodeMembers(nodeId: string, orgSlug?: string): Promise<NodeMember[]> {
  const result = await fetchApi<{ members: NodeMember[] }>(`/nodes/${nodeId}/members`, {}, orgSlug)
  return result.success ? result.data?.members ?? [] : []
}

export function assignUserToNode(
  nodeId: string,
  userId: string,
  role: string = 'member',
  isPrimary: boolean = false,
  orgSlug?: string,
): Promise<ApiResponse<NodeMember>> {
  return fetchApi(`/nodes/${nodeId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, role, isPrimary }),
  }, orgSlug)
}

export function removeUserFromNode(
  nodeId: string,
  userId: string,
  orgSlug?: string,
): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/nodes/${nodeId}/members/${userId}`, { method: 'DELETE' }, orgSlug)
}

export async function getAvailableUsersForNode(
  nodeId: string,
  query: string = '',
  includeCurrentMembers?: boolean,
  orgSlug?: string,
): Promise<UserWithHierarchy['user'][]> {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (includeCurrentMembers) params.set('includeCurrentMembers', 'true')

  const result = await fetchApi<{ users: UserWithHierarchy['user'][] }>(
    `/nodes/${nodeId}/members/available?${params.toString()}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.users ?? [] : []
}

export async function searchOrganizationUsers(query: string = '', orgSlug?: string): Promise<NodeUser[]> {
  const params = new URLSearchParams()
  if (query) params.set('query', query)

  const result = await fetchApi<{ users: UserWithHierarchy['user'][] }>(
    `/users/search?${params.toString()}`,
    {},
    orgSlug,
  )
  return result.success
    ? (result.data?.users ?? []).filter((user): user is NodeUser => Boolean(user))
    : []
}
