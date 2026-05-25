import { logger as techDebtLogger } from '@/lib/utils/logger'
export interface UserGroup {
  id: string
  organization_id: string
  name: string
  description?: string | null
  color: string
  created_by?: string | null
  created_at: string
  updated_at: string
  member_count?: number
}

export interface UserGroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'leader' | 'member'
  joined_at: string
  added_by?: string | null
  created_at: string
  user?: {
    id: string
    username: string
    email: string
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
    profile_picture_url?: string | null
  }
}

export interface CreateUserGroupRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateUserGroupRequest {
  name?: string
  description?: string
  color?: string
}

export interface AddGroupMemberRequest {
  user_id: string
  role?: 'leader' | 'member'
}

export class UserGroupsService {
  private static apiBase(orgSlug: string) {
    return `/api/${orgSlug}/business/user-groups`
  }

  static async getGroups(orgSlug: string): Promise<UserGroup[]> {
    try {
      const response = await fetch(this.apiBase(orgSlug), {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        return []
      }

      return data.groups || []
    } catch (error) {
      techDebtLogger.error('Error fetching groups:', error)
      return []
    }
  }

  static async getGroup(orgSlug: string, groupId: string): Promise<UserGroup | null> {
    try {
      const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        return null
      }

      return data.group || null
    } catch (error) {
      techDebtLogger.error('Error fetching group:', error)
      return null
    }
  }

  static async createGroup(orgSlug: string, groupData: CreateUserGroupRequest): Promise<UserGroup> {
    const response = await fetch(this.apiBase(orgSlug), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(groupData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al crear grupo')
    }

    return data.group
  }

  static async updateGroup(orgSlug: string, groupId: string, groupData: UpdateUserGroupRequest): Promise<UserGroup> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(groupData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar grupo')
    }

    return data.group
  }

  static async deleteGroup(orgSlug: string, groupId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar grupo' }))
      throw new Error(error.message || 'Error al eliminar grupo')
    }
  }

  static async getGroupMembers(orgSlug: string, groupId: string): Promise<UserGroupMember[]> {
    try {
      const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}/members`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        return []
      }

      return data.members || []
    } catch (error) {
      techDebtLogger.error('Error fetching group members:', error)
      return []
    }
  }

  static async addGroupMember(orgSlug: string, groupId: string, memberData: AddGroupMemberRequest): Promise<UserGroupMember> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(memberData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al agregar miembro')
    }

    return data.member
  }

  static async removeGroupMember(orgSlug: string, groupId: string, memberId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al remover miembro' }))
      throw new Error(error.message || 'Error al remover miembro')
    }
  }

  static async updateMemberRole(orgSlug: string, groupId: string, memberId: string, role: 'leader' | 'member'): Promise<UserGroupMember> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${groupId}/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ role }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar rol')
    }

    return data.member
  }
}
