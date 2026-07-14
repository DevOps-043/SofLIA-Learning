import type { UserGender } from '../../../lib/schemas/user-demographics.schema'
import type { AuthOAuthProvider } from '../../auth/services/auth-account-method.service'

export interface UserProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  bio: string
  location: string
  platform_role: string
  job_title: string
  job_description: string
  profile_picture_url: string
  country_code: string
  date_of_birth: string | null
  gender: UserGender | null
  points: number
  created_at: string
  last_login_at: string
  email_verified: boolean
  auth_providers: AuthOAuthProvider[]
  can_edit_credentials: boolean
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  bio?: string
  location?: string
  platform_role?: string
  job_title?: string
  job_description?: string
  profile_picture_url?: string
  country_code?: string
  date_of_birth?: string | null
  gender?: UserGender | null
}

export interface UserSubscription {
  subscription_id: string
  subscription_type: string
  subscription_status: string
  price_cents: number
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  course_id: string | null
  course_title?: string | null
}

export interface UserStats {
  completedCourses: number
  completedLessons: number
  certificates: number
  coursesInProgress: number
  subscriptions?: UserSubscription[]
}

export type ProfileTabId = 'personal' | 'security'

export interface ProfileColorPalette {
  primary: string
  accent: string
  success: string
  warning: string
  error: string
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  grayLight: string
  grayMedium: string
  text: string
  textSecondary: string
  border: string
}

export interface UseProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  loading: boolean
  error: string | null
  saving: boolean
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>
  uploadProfilePicture: (file: File) => Promise<string>
  removeProfilePicture: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refetch: () => Promise<void>
}
