import type { AdminUser } from '../../services/adminUsers.service'
import type { UserGender } from '../../../../lib/schemas/user-demographics.schema'

export interface EditUserFormData {
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  cargo_rol: string
  type_rol: string
  email_verified: boolean
  phone: string
  date_of_birth: string
  gender: UserGender | ''
  bio: string
  location: string
  profile_picture_url: string
  country_code: string
  points: number
}

export interface EditUserModalProps {
  user: AdminUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<AdminUser>) => Promise<void>
}

export type TabType = 'personal' | 'account'

export interface EditUserTabConfig {
  id: TabType
  label: string
  iconName: 'user' | 'shield'
}
