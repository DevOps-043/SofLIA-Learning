import type { UserGender } from '../../../../lib/schemas/user-demographics.schema'

export type TabType = 'basic' | 'personal' | 'additional'

export interface NewAdminUserData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  display_name: string
  platform_role: string
  phone: string
  date_of_birth: string
  gender: UserGender | ''
  bio: string
  location: string
  profile_picture_url: string
  curriculum_url: string
  website_url: string
  points: number
  country_code: string
}
