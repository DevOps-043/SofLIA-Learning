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
  cargo_rol: string
  type_rol: string
  profile_picture_url: string
  curriculum_url: string
  linkedin_url: string
  github_url: string
  website_url: string
  country_code: string
  points: number
  created_at: string
  last_login_at: string
  email_verified: boolean
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
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
  curriculum_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  country_code?: string
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
  uploadCurriculum: (file: File) => Promise<string>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refetch: () => Promise<void>
}
