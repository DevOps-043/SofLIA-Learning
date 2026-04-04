export interface BusinessUser {
  id: string
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  cargo_rol: string
  job_title?: string | null  // Antes type_rol - ahora en organization_users
  organization_id?: string | null
  email_verified: boolean
  profile_picture_url?: string | null
  bio?: string | null
  location?: string | null
  phone?: string | null
  points: number
  last_login_at?: string | null
  created_at: string
  updated_at: string
  org_role?: 'owner' | 'admin' | 'member'
  org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  joined_at?: string
  // Hierarchy fields
  region_id?: string | null
  zone_id?: string | null
  team_id?: string | null
  hierarchy_scope?: 'organization' | 'region' | 'zone' | 'team' | null
  // Populated names for display
  region_name?: string | null
  zone_name?: string | null
  team_name?: string | null
}

export interface BusinessInvitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  metadata?: Record<string, unknown>
}

export interface BulkInviteLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  current_uses: number
  role: string
  expires_at: string
  status: 'active' | 'paused' | 'expired' | 'exhausted'
  created_at: string
}

export interface BusinessUserStats {
  total: number
  active: number
  invited: number
  suspended: number
  admins: number
  members: number
  bulk_link_usage?: number
}

export interface CreateBusinessUserRequest {
  username: string
  email: string
  password?: string
  first_name?: string
  last_name?: string
  display_name?: string
  job_title: string  // Antes type_rol - cargo/puesto en la organización
  org_role?: 'owner' | 'admin' | 'member'
  send_invitation?: boolean
}

export interface UpdateBusinessUserRequest {
  first_name?: string
  last_name?: string
  display_name?: string
  email?: string
  cargo_rol?: string
  job_title?: string  // Antes type_rol - cargo/puesto en la organización
  org_role?: 'owner' | 'admin' | 'member'
  org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  profile_picture_url?: string
  bio?: string
  location?: string
  phone?: string
}

export class BusinessUsersService {
  private static apiBase(orgSlug: string) {
    return `/api/${orgSlug}/business/users`
  }

  static async getOrganizationUsers(orgSlug: string): Promise<{ users: BusinessUser[], invitations: BusinessInvitation[] }> {
    try {
      const response = await fetch(this.apiBase(orgSlug), {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        console.error('Error fetching users:', data.error || response.statusText)
        return { users: [], invitations: [] }
      }

      return {
        users: data.users || [],
        invitations: data.invitations || []
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { users: [], invitations: [] }
    }
  }

  static async getOrganizationStats(orgSlug: string): Promise<BusinessUserStats> {
    try {
      const response = await fetch(`${this.apiBase(orgSlug)}/stats`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        return { total: 0, active: 0, invited: 0, suspended: 0, admins: 0, members: 0 }
      }

      return data.stats || { total: 0, active: 0, invited: 0, suspended: 0, admins: 0, members: 0 }
    } catch (error) {
      return { total: 0, active: 0, invited: 0, suspended: 0, admins: 0, members: 0 }
    }
  }

  static async createUser(orgSlug: string, userData: CreateBusinessUserRequest): Promise<BusinessUser> {
    const response = await fetch(this.apiBase(orgSlug), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al crear usuario')
    }

    return data.user
  }

  static async updateUser(orgSlug: string, userId: string, userData: UpdateBusinessUserRequest): Promise<BusinessUser> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar usuario')
    }

    return data.user
  }

  static async deleteUser(orgSlug: string, userId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar usuario' }))
      throw new Error(error.message || 'Error al eliminar usuario')
    }
  }

  static async resendInvitation(orgSlug: string, userId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${userId}/resend-invitation`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al reenviar invitación' }))
      throw new Error(error.message || 'Error al reenviar invitación')
    }
  }

  static async suspendUser(orgSlug: string, userId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${userId}/suspend`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al suspender usuario' }))
      throw new Error(error.message || 'Error al suspender usuario')
    }
  }

  static async activateUser(orgSlug: string, userId: string): Promise<void> {
    const response = await fetch(`${this.apiBase(orgSlug)}/${userId}/activate`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al activar usuario' }))
      throw new Error(error.message || 'Error al activar usuario')
    }
  }

  // Invite Links Management
  static async updateInviteLinkStatus(orgSlug: string, linkId: string, action: 'pause' | 'resume'): Promise<BulkInviteLink> {
    const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action })
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al actualizar el enlace')
    }
    return data.link
  }

  static async deleteInviteLink(orgSlug: string, linkId: string): Promise<void> {
    const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Error al eliminar el enlace' }))
      throw new Error(data.error || 'Error al eliminar el enlace')
    }
  }
}
