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
  onEdit: (member: CompanyMember) => void
}
