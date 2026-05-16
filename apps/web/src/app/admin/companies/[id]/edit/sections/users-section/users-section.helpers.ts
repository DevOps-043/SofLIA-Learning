'use client'

import type { CompanyData, CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'

export function getUserDisplayName(user?: CompanyMember['user']) {
  if (!user) return 'Usuario'
  if (user.display_name) return user.display_name
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  if (user.first_name) return user.first_name
  return user.email.split('@')[0]
}

export function getRoleBadge(role: string | null, colors: Record<string, string>) {
  switch (role) {
    case 'owner':
      return { label: 'Owner', color: colors.warning }
    case 'admin':
      return { label: 'Admin', color: colors.accent }
    default:
      return { label: 'Miembro', color: colors.grayMedium }
  }
}

export function getStatusBadge(status: string | null, colors: Record<string, string>) {
  switch (status) {
    case 'active':
      return { label: 'Activo', color: colors.success }
    case 'invited':
      return { label: 'Invitado', color: colors.warning }
    case 'suspended':
      return { label: 'Suspendido', color: colors.error }
    default:
      return { label: status || 'Desconocido', color: colors.grayMedium }
  }
}

export function filterMembers(
  company: CompanyData,
  searchTerm: string,
  roleFilter: string,
) {
  return (
    company.members?.filter((member) => {
      const value = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        member.user?.email?.toLowerCase().includes(value) ||
        member.user?.first_name?.toLowerCase().includes(value) ||
        member.user?.last_name?.toLowerCase().includes(value)
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      return matchesSearch && matchesRole
    }) || []
  )
}

export function filterInvitations(company: CompanyData, searchTerm: string) {
  return (
    company.pending_invitations?.filter(
      (invitation) => !searchTerm || invitation.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []
  )
}

export function filterInviteLinks(company: CompanyData, searchTerm: string) {
  return (
    company.bulk_invite_links?.filter((link) => {
      const value = searchTerm.toLowerCase()
      return (
        !searchTerm ||
        link.name?.toLowerCase().includes(value) ||
        link.token?.toLowerCase().includes(value)
      )
    }) || []
  )
}
