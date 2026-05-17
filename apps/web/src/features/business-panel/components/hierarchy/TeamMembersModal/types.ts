import type { BusinessUser } from '../../services/businessUsers.service'
import type { UserWithHierarchy } from '../../types/hierarchy.types'

export interface TeamMembersModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamName: string
  currentMembers: UserWithHierarchy[]
  onMembersUpdated: () => void
}

export interface TeamMembersTheme {
  accentColor: string
  cardBackground: string
  primaryColor: string
}

export type AvailableTeamUser = BusinessUser
