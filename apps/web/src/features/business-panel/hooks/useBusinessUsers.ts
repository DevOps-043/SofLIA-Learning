import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useOrganizationStore } from '@/core/stores/organizationStore'
import {
  BusinessUsersService,
  BusinessUser,
  BusinessUserStats,
  BusinessInvitation,
  BulkInviteLink,
  BusinessUsersPaginationMeta,
  BusinessUsersResourceTotals,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from '../services/businessUsers.service'

type OrganizationStoreState = ReturnType<typeof useOrganizationStore.getState>
type BusinessUsersResource = 'users' | 'invitations' | 'links'

interface UseBusinessUsersOptions {
  activeResource?: BusinessUsersResource
  searchTerm?: string
  filterRole?: string
  filterStatus?: string
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 24

const EMPTY_STATS: BusinessUserStats = {
  total: 0,
  active: 0,
  invited: 0,
  suspended: 0,
  admins: 0,
  members: 0,
}

const EMPTY_PAGINATION: BusinessUsersPaginationMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
}

export function useBusinessUsers(
  orgSlugProp?: string,
  options: UseBusinessUsersOptions = {},
) {
  const params = useParams()
  const urlOrgSlug = params?.orgSlug as string | undefined
  const currentOrgSlug = useOrganizationStore((state: OrganizationStoreState) => state.currentOrganization?.slug)
  const orgSlug = orgSlugProp || urlOrgSlug || currentOrgSlug || ''
  const activeResource = options.activeResource || 'users'
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE
  const searchTerm = options.searchTerm?.trim() || ''
  const filterRole = options.filterRole || 'all'
  const filterStatus = options.filterStatus || 'all'

  const [users, setUsers] = useState<BusinessUser[]>([])
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [inviteLinks, setInviteLinks] = useState<BulkInviteLink[]>([])
  const [stats, setStats] = useState<BusinessUserStats>(EMPTY_STATS)
  const [paginationByResource, setPaginationByResource] = useState<Record<BusinessUsersResource, BusinessUsersPaginationMeta>>({
    users: EMPTY_PAGINATION,
    invitations: EMPTY_PAGINATION,
    links: EMPTY_PAGINATION,
  })
  const [resourceTotals, setResourceTotals] = useState<BusinessUsersResourceTotals>({
    users: 0,
    invitations: 0,
    inviteLinks: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgData, setOrgData] = useState<{ id: string, name: string, logo_url?: string } | null>(null)
  const getOrgBySlug = useOrganizationStore((state: OrganizationStoreState) => state.getOrganizationBySlug)

  useEffect(() => {
    if (orgSlug) {
      const org = getOrgBySlug(orgSlug)
      if (org) {
        setOrgData({
          id: org.id,
          name: org.name,
          logo_url: org.logoUrl || undefined,
        })
      }
    }
  }, [orgSlug, getOrgBySlug])

  const buildResourceUrl = useCallback(
    (resource: BusinessUsersResource, page: number) => {
      const query = new URLSearchParams({
        resource,
        page: String(page),
        pageSize: String(pageSize),
      })

      if (searchTerm) query.set('search', searchTerm)
      if (resource === 'users' && filterRole !== 'all') query.set('role', filterRole)
      if (resource === 'users' && filterStatus !== 'all') query.set('status', filterStatus)

      return `/api/${orgSlug}/business/users?${query.toString()}`
    },
    [filterRole, filterStatus, orgSlug, pageSize, searchTerm],
  )

  const fetchResource = useCallback(
    async (resource: BusinessUsersResource = activeResource, page = 1) => {
      if (!orgSlug) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(buildResourceUrl(resource, page), {
          credentials: 'include',
        })
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar usuarios')
        }

        if (resource === 'users') setUsers(data.users || [])
        if (resource === 'invitations') setInvitations(data.invitations || [])
        if (resource === 'links') setInviteLinks(data.inviteLinks || [])

        setStats(data.stats || EMPTY_STATS)
        setResourceTotals(data.totals || {
          users: data.stats?.total || 0,
          invitations: data.invitations?.length || 0,
          inviteLinks: data.inviteLinks?.length || 0,
        })

        if (data.pagination) {
          setPaginationByResource((prev) => ({
            ...prev,
            [resource]: data.pagination,
          }))
        }

        if (data.organization) {
          setOrgData({
            id: data.organization.id,
            name: data.organization.name,
            logo_url: data.organization.logo_url || undefined,
          })
        } else {
          const org = getOrgBySlug(orgSlug)
          if (org) {
            setOrgData({
              id: org.id,
              name: org.name,
              logo_url: org.logoUrl || undefined,
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    },
    [activeResource, buildResourceUrl, getOrgBySlug, orgSlug],
  )

  useEffect(() => {
    void fetchResource(activeResource, 1)
  }, [activeResource, fetchResource, filterRole, filterStatus, pageSize, searchTerm])

  const syncOrgData = useCallback(() => {
    const currentPage = paginationByResource[activeResource]?.page || 1
    void fetchResource(activeResource, currentPage)
  }, [activeResource, fetchResource, paginationByResource])

  const setResourcePage = useCallback(
    (resource: BusinessUsersResource, page: number) => {
      void fetchResource(resource, page)
    },
    [fetchResource],
  )

  const createUser = async (userData: CreateBusinessUserRequest) => {
    const newUser = await BusinessUsersService.createUser(orgSlug, userData)

    if (!orgData && newUser.organization_id) {
      setOrgData({ id: newUser.organization_id, name: '' })
    }

    await fetchResource('users', 1)
    return newUser
  }

  const updateUser = async (
    userId: string,
    userData: UpdateBusinessUserRequest,
  ) => {
    const updatedUser = await BusinessUsersService.updateUser(orgSlug, userId, userData)
    setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))
    return updatedUser
  }

  const deleteUser = async (userId: string) => {
    await BusinessUsersService.deleteUser(orgSlug, userId)
    const currentPage = paginationByResource.users?.page || 1
    await fetchResource('users', currentPage)
  }

  const resendInvitation = async (userId: string) => {
    await BusinessUsersService.resendInvitation(orgSlug, userId)
  }

  const suspendUser = async (userId: string) => {
    await BusinessUsersService.suspendUser(orgSlug, userId)
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, org_status: 'suspended' as const }
        : user
    ))
    await fetchResource('users', paginationByResource.users?.page || 1)
  }

  const activateUser = async (userId: string) => {
    await BusinessUsersService.activateUser(orgSlug, userId)
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, org_status: 'active' as const }
        : user
    ))
    await fetchResource('users', paginationByResource.users?.page || 1)
  }

  const updateInviteLinkStatus = async (linkId: string, action: 'pause' | 'resume') => {
    const updatedLink = await BusinessUsersService.updateInviteLinkStatus(orgSlug, linkId, action)
    setInviteLinks(prev => prev.map(link => link.id === linkId ? updatedLink : link))
    return updatedLink
  }

  const deleteInviteLink = async (linkId: string) => {
    await BusinessUsersService.deleteInviteLink(orgSlug, linkId)
    await fetchResource('links', paginationByResource.links?.page || 1)
  }

  const activePagination = useMemo(
    () => paginationByResource[activeResource] || EMPTY_PAGINATION,
    [activeResource, paginationByResource],
  )

  return {
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    paginationByResource,
    activePagination,
    resourceTotals,
    syncOrgData,
    setResourcePage,
    createUser,
    updateUser,
    deleteUser,
    resendInvitation,
    suspendUser,
    activateUser,
    updateInviteLinkStatus,
    deleteInviteLink,
  }
}
