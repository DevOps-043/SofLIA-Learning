import type {
  CommunityAccessRequest,
  CommunityMember,
  CommunityPost,
  CommunityVideo,
  InstructorCommunityDetailPayload
} from '../types/instructor-community-detail.types'

async function parseJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

async function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return
  }

  const payload = await parseJson(response)
  const errorMessage =
    (typeof payload.message === 'string' && payload.message) ||
    (typeof payload.error === 'string' && payload.error) ||
    fallbackMessage

  throw new Error(errorMessage)
}

export class InstructorCommunityDetailService {
  static async getCommunityDetail(slug: string): Promise<InstructorCommunityDetailPayload> {
    const response = await fetch(`/api/instructor/communities/slug/${slug}/detail`)
    await ensureOk(response, 'Error al cargar la comunidad')
    return await response.json()
  }

  static async inviteUser(communityId: string, userId: string, role: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/invite-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    })

    await ensureOk(response, 'Error al invitar usuario')
  }

  static async updateMemberRole(communityId: string, memberId: string, role: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/members/${memberId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })

    await ensureOk(response, 'Error al actualizar el rol del miembro')
  }

  static async removeMember(communityId: string, memberId: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/members/${memberId}`, {
      method: 'DELETE'
    })

    await ensureOk(response, 'Error al remover el miembro')
  }

  static async updateAccessRequest(communityId: string, requestId: string, action: 'approve' | 'reject'): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/access-requests/${requestId}/${action}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })

    await ensureOk(response, `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud`)
  }

  static async deletePost(communityId: string, postId: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/posts/${postId}`, {
      method: 'DELETE'
    })

    await ensureOk(response, 'Error al eliminar el post')
  }

  static async togglePostVisibility(communityId: string, postId: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/posts/${postId}/toggle-visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })

    await ensureOk(response, 'Error al actualizar la visibilidad del post')
  }

  static async togglePostPin(communityId: string, postId: string): Promise<void> {
    const response = await fetch(`/api/admin/communities/${communityId}/posts/${postId}/toggle-pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })

    await ensureOk(response, 'Error al actualizar el estado fijado del post')
  }
}

export function replaceCommunityMemberRole(members: CommunityMember[], memberId: string, role: string) {
  return members.map(member => (member.id === memberId ? { ...member, role } : member))
}

export function removeCommunityMember(members: CommunityMember[], memberId: string) {
  return members.filter(member => member.id !== memberId)
}

export function updateCommunityRequestStatus(requests: CommunityAccessRequest[], requestId: string, status: string) {
  return requests.map(request => (request.id === requestId ? { ...request, status } : request))
}

export function removeCommunityPost(posts: CommunityPost[], postId: string) {
  return posts.filter(post => post.id !== postId)
}

export function toggleCommunityPostBoolean(posts: CommunityPost[], postId: string, key: 'is_hidden' | 'is_pinned') {
  return posts.map(post => (post.id === postId ? { ...post, [key]: !post[key] } : post))
}
