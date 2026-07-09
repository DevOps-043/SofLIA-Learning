'use client'

import type { CompanyData, CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'

export type CompanyUsersSubTab = 'members' | 'invitations' | 'links'

export interface UsersModalConfig {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  message?: string
}

export interface UsersSectionProps {
  company: CompanyData
  onUpdate: () => void
}

export interface MembersTableProps {
  members: CompanyMember[]
  onDelete: (member: CompanyMember) => void
  onEditProfile: (member: CompanyMember) => void
  onViewStats: (member: CompanyMember) => void
  onManageAssignments: (member: CompanyMember) => void
  /** True when the organization has no slug — disables profile/stats actions, which require it. */
  actionsDisabled?: boolean
}
