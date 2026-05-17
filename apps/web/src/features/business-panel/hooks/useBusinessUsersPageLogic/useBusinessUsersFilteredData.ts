import { useMemo } from 'react'
import type {
  BulkInviteLink,
  BusinessInvitation,
  BusinessUser,
} from '@/features/business-panel/services/businessUsers.service'
import type { JoinRequest } from '@/features/business-panel/services/joinRequests.service'

interface UseBusinessUsersFilteredDataParams {
  users: BusinessUser[]
  invitations: BusinessInvitation[]
  inviteLinks: BulkInviteLink[]
  joinRequests: JoinRequest[]
  normalizedSearchTerm: string
  filterRole: string
  filterStatus: string
  filterRegion: string
  filterZone: string
  filterTeam: string
}

export function useBusinessUsersFilteredData({
  users,
  invitations,
  inviteLinks,
  joinRequests,
  normalizedSearchTerm,
  filterRole,
  filterStatus,
  filterRegion,
  filterZone,
  filterTeam,
}: UseBusinessUsersFilteredDataParams) {
  const uniqueRegions = useMemo(() => [...new Set(users.map((user) => user.region_name ?? null))], [users])
  const uniqueZones = useMemo(() => [...new Set(users.map((user) => user.zone_name ?? null))], [users])
  const uniqueTeams = useMemo(() => [...new Set(users.map((user) => user.team_name ?? null))], [users])
  const filteredUsers = useMemo(() => users.filter((user) => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = normalizedSearchTerm.length === 0 ||
      displayName.toLowerCase().includes(normalizedSearchTerm) ||
      user.email.toLowerCase().includes(normalizedSearchTerm) ||
      user.username.toLowerCase().includes(normalizedSearchTerm)
    return matchesSearch &&
      (filterRole === 'all' || user.org_role === filterRole) &&
      (filterStatus === 'all' || user.org_status === filterStatus) &&
      (filterRegion === 'all' || user.region_name === filterRegion) &&
      (filterZone === 'all' || user.zone_name === filterZone) &&
      (filterTeam === 'all' || user.team_name === filterTeam)
  }), [filterRegion, filterRole, filterStatus, filterTeam, filterZone, normalizedSearchTerm, users])
  const filteredInvitations = useMemo(() => invitations.filter((invitation) =>
    normalizedSearchTerm.length === 0 ||
    invitation.email.toLowerCase().includes(normalizedSearchTerm) ||
    invitation.role.toLowerCase().includes(normalizedSearchTerm)
  ), [invitations, normalizedSearchTerm])
  const filteredInviteLinks = useMemo(() => inviteLinks.filter((link) =>
    normalizedSearchTerm.length === 0 ||
    (link.name || '').toLowerCase().includes(normalizedSearchTerm) ||
    link.role.toLowerCase().includes(normalizedSearchTerm) ||
    link.status.toLowerCase().includes(normalizedSearchTerm) ||
    link.token.toLowerCase().includes(normalizedSearchTerm)
  ), [inviteLinks, normalizedSearchTerm])
  const filteredJoinRequests = useMemo(() => joinRequests.filter((request) => {
    if (normalizedSearchTerm.length === 0) return true
    const displayName = request.users
      ? [request.users.first_name, request.users.last_name].filter(Boolean).join(' ').trim() || request.users.username
      : 'usuario'
    return displayName.toLowerCase().includes(normalizedSearchTerm) ||
      request.users?.email.toLowerCase().includes(normalizedSearchTerm) ||
      request.job_title?.toLowerCase().includes(normalizedSearchTerm) ||
      request.message?.toLowerCase().includes(normalizedSearchTerm)
  }), [joinRequests, normalizedSearchTerm])

  return { uniqueRegions, uniqueZones, uniqueTeams, filteredUsers, filteredInvitations, filteredInviteLinks, filteredJoinRequests }
}
