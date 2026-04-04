import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import {
  BusinessUsersService,
  BusinessUser,
  BusinessUserStats,
  BusinessInvitation,
  BulkInviteLink,
  CreateBusinessUserRequest
} from '../services/businessUsers.service'

type OrganizationStoreState = ReturnType<typeof useOrganizationStore.getState>

export function useBusinessUsers(orgSlugProp?: string) {
  const params = useParams()
  const urlOrgSlug = params?.orgSlug as string | undefined
  const currentOrgSlug = useOrganizationStore((state: OrganizationStoreState) => state.currentOrganization?.slug)
  const orgSlug = orgSlugProp || urlOrgSlug || currentOrgSlug || ''
  
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [inviteLinks, setInviteLinks] = useState<BulkInviteLink[]>([])
  const [stats, setStats] = useState<BusinessUserStats>({
    total: 0,
    active: 0,
    invited: 0,
    suspended: 0,
    admins: 0,
    members: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgData, setOrgData] = useState<{ id: string, name: string, logo_url?: string } | null>(null)
  const getOrgBySlug = useOrganizationStore((state: OrganizationStoreState) => state.getOrganizationBySlug)

  // Sincronizar datos de la organización desde el store basándose en el slug
  useEffect(() => {
    if (orgSlug) {
      const org = getOrgBySlug(orgSlug)
      if (org) {
        setOrgData({
          id: org.id,
          name: org.name,
          logo_url: org.logoUrl || undefined
        })
      }
    }
  }, [orgSlug, getOrgBySlug])

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/${orgSlug}/business/users`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar usuarios')
      }
      
      setUsers(data.users || [])
      setInvitations(data.invitations || [])
      setInviteLinks(data.inviteLinks || [])
      setStats(data.stats || {
        total: 0, active: 0, invited: 0, suspended: 0, admins: 0, members: 0
      })

      // Sincronizar datos de la organización directamente desde la API
      if (data.organization) {
        setOrgData({
          id: data.organization.id,
          name: data.organization.name,
          logo_url: data.organization.logo_url || undefined
        })
      } else {
        // Fallback al store si la API no devuelve org
        const org = getOrgBySlug(orgSlug)
        if (org) {
          setOrgData({
            id: org.id,
            name: org.name,
            logo_url: org.logoUrl || undefined
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug, getOrgBySlug])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const createUser = async (userData: CreateBusinessUserRequest) => {
    try {
      const newUser = await BusinessUsersService.createUser(orgSlug, userData)

      // Actualizar orgData si no lo teníamos
      if (!orgData && newUser.organization_id) {
        setOrgData({ id: newUser.organization_id, name: '' })
      }

      // Actualización optimista: agregar usuario y actualizar stats localmente
      setUsers(prev => [...prev, newUser])
      setStats(prev => {
        const statusKey = newUser.org_status && newUser.org_status !== 'removed' ? newUser.org_status as 'active' | 'invited' | 'suspended' : null;
        const roleKey = newUser.org_role === 'owner' || newUser.org_role === 'admin' ? 'admins' : 'members';
        return {
          ...prev,
          total: prev.total + 1,
          ...(statusKey ? { [statusKey]: prev[statusKey] + 1 } : {}),
          [roleKey]: prev[roleKey] + 1
        }
      })

      return newUser
    } catch (err) {
      throw err
    }
  }

  const updateUser = async (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
    cargo_rol?: string
    job_title?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
    profile_picture_url?: string
    bio?: string
    location?: string
    phone?: string
  }) => {
    try {
      const updatedUser = await BusinessUsersService.updateUser(orgSlug, userId, userData)

      // Actualización optimista: solo actualizar el usuario modificado
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))

      // Si cambió el status u role, actualizar stats localmente
      if (userData.org_status || userData.org_role) {
        const oldUser = users.find(u => u.id === userId)
        if (oldUser) {
          setStats(prev => {
            const newStats = { ...prev }

            // Actualizar contadores de status
            if (userData.org_status && oldUser.org_status !== userData.org_status) {
              const oldStatus = oldUser.org_status as 'active' | 'invited' | 'suspended' | 'removed' | undefined;
              const newStatus = userData.org_status as 'active' | 'invited' | 'suspended' | 'removed' | undefined;
              
              if (oldStatus && oldStatus !== 'removed') {
                newStats[oldStatus] = Math.max(0, newStats[oldStatus] - 1)
              }
              if (newStatus && newStatus !== 'removed') {
                newStats[newStatus] = newStats[newStatus] + 1
              }
            }

            // Actualizar contadores de role
            if (userData.org_role && oldUser.org_role !== userData.org_role) {
              const oldIsAdmin = oldUser.org_role === 'owner' || oldUser.org_role === 'admin'
              const newIsAdmin = userData.org_role === 'owner' || userData.org_role === 'admin'

              if (oldIsAdmin !== newIsAdmin) {
                newStats.admins = oldIsAdmin ? newStats.admins - 1 : newStats.admins + 1
                newStats.members = oldIsAdmin ? newStats.members + 1 : newStats.members - 1
              }
            }

            return newStats
          })
        }
      }

      return updatedUser
    } catch (err) {
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId)

      await BusinessUsersService.deleteUser(orgSlug, userId)

      // Actualización optimista: eliminar usuario y actualizar stats
      setUsers(prev => prev.filter(user => user.id !== userId))

      if (userToDelete) {
        setStats(prev => {
          const statusKey = userToDelete.org_status && userToDelete.org_status !== 'removed' ? userToDelete.org_status as 'active' | 'invited' | 'suspended' : null;
          const roleKey = userToDelete.org_role === 'owner' || userToDelete.org_role === 'admin' ? 'admins' : 'members';
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            ...(statusKey ? { [statusKey]: Math.max(0, prev[statusKey] - 1) } : {}),
            [roleKey]: Math.max(0, prev[roleKey] - 1)
          }
        })
      }

      // Refetch forzarndo actualización real desde DB
      await fetchUsers()
    } catch (err) {
      throw err
    }
  }

  const resendInvitation = async (userId: string) => {
    try {
      await BusinessUsersService.resendInvitation(orgSlug, userId)
    } catch (err) {
      throw err
    }
  }

  const suspendUser = async (userId: string) => {
    try {
      const oldUser = users.find(u => u.id === userId)

      await BusinessUsersService.suspendUser(orgSlug, userId)

      // Actualización optimista
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, org_status: 'suspended' as const }
          : user
      ))

      // Actualizar stats si el usuario estaba activo
      if (oldUser?.org_status === 'active') {
        setStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          suspended: prev.suspended + 1
        }))
      }
    } catch (err) {
      throw err
    }
  }

  const activateUser = async (userId: string) => {
    try {
      const oldUser = users.find(u => u.id === userId)

      await BusinessUsersService.activateUser(orgSlug, userId)

      // Actualización optimista
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, org_status: 'active' as const }
          : user
      ))

      // Actualizar stats si el usuario estaba suspendido
      if (oldUser?.org_status === 'suspended') {
        setStats(prev => ({
          ...prev,
          active: prev.active + 1,
          suspended: Math.max(0, prev.suspended - 1)
        }))
      }
    } catch (err) {
      throw err
    }
  }

  const updateInviteLinkStatus = async (linkId: string, action: 'pause' | 'resume') => {
    try {
      const updatedLink = await BusinessUsersService.updateInviteLinkStatus(orgSlug, linkId, action)
      setInviteLinks(prev => prev.map(link => link.id === linkId ? updatedLink : link))
      return updatedLink
    } catch (err) {
      throw err
    }
  }

  const deleteInviteLink = async (linkId: string) => {
    try {
      await BusinessUsersService.deleteInviteLink(orgSlug, linkId)
      setInviteLinks(prev => prev.filter(link => link.id !== linkId))
    } catch (err) {
      throw err
    }
  }

  return {
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    syncOrgData: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resendInvitation,
    suspendUser,
    activateUser,
    updateInviteLinkStatus,
    deleteInviteLink
  }
}
