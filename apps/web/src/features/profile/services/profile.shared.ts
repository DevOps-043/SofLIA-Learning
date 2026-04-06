import type { Database } from '../../../lib/supabase/types'
import type {
  ProfileColorPalette,
  UpdateProfileRequest,
  UserProfile,
  UserStats,
  UserSubscription
} from '../types/profile.types'

type UserRow = Database['public']['Tables']['users']['Row']
type UserProfileExtraFields = {
  phone_number?: string | null
  curriculum_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  website_url?: string | null
  points?: number | null
}
type UserProfileRow = Partial<UserRow> & UserProfileExtraFields & Pick<UserRow, 'id' | 'created_at'>

type SubscriptionRecord = {
  subscription_id: string
  subscription_type: string
  subscription_status: string | null
  price_cents: number
  start_date: string | null
  end_date: string | null
  next_billing_date: string | null
  course_id: string | null
  courses?: {
    title?: string | null
  } | null
}

export const PROFILE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'] as const
export const PROFILE_CURRICULUM_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const
export const PROFILE_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024

export const DEFAULT_PROFILE_COLORS: ProfileColorPalette = {
  primary: '#0A2540',
  accent: '#00D4B3',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bgPrimary: '#0F1419',
  bgSecondary: '#1E2329',
  bgTertiary: '#0A0D12',
  grayLight: '#E9ECEF',
  grayMedium: '#6C757D',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.06)'
}

export function mapUserProfileRow(data: UserProfileRow): UserProfile {
  return {
    id: data.id,
    username: data.username || '',
    email: data.email || '',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    display_name: data.display_name || data.first_name || 'Usuario',
    phone: data.phone || data.phone_number || '',
    bio: data.bio || '',
    location: data.location || '',
    cargo_rol: data.cargo_rol || '',
    type_rol: data.type_rol || '',
    profile_picture_url: data.profile_picture_url || '',
    curriculum_url: data.curriculum_url || '',
    linkedin_url: data.linkedin_url || '',
    github_url: data.github_url || '',
    website_url: data.website_url || '',
    country_code: data.country_code || '',
    points: data.points || 0,
    created_at: data.created_at,
    last_login_at: data.last_login_at || data.created_at,
    email_verified: data.email_verified || false
  }
}

export function createEmptyUserStats(): UserStats {
  return {
    completedCourses: 0,
    completedLessons: 0,
    certificates: 0,
    coursesInProgress: 0,
    subscriptions: []
  }
}

export function normalizeUserStats(stats: Partial<UserStats> | null | undefined): UserStats {
  const empty = createEmptyUserStats()

  if (!stats) {
    return empty
  }

  return {
    completedCourses: stats.completedCourses ?? empty.completedCourses,
    completedLessons: stats.completedLessons ?? empty.completedLessons,
    certificates: stats.certificates ?? empty.certificates,
    coursesInProgress: stats.coursesInProgress ?? empty.coursesInProgress,
    subscriptions: stats.subscriptions ?? empty.subscriptions
  }
}

export function pickAllowedProfileUpdates(updates: UpdateProfileRequest): Partial<UpdateProfileRequest> {
  const allowedFields: (keyof UpdateProfileRequest)[] = [
    'username',
    'first_name',
    'last_name',
    'display_name',
    'phone',
    'bio',
    'location',
    'profile_picture_url',
    'country_code',
  ]

  return allowedFields.reduce<Partial<UpdateProfileRequest>>((accumulator, field) => {
    if (updates[field] !== undefined) {
      accumulator[field] = updates[field]
    }
    return accumulator
  }, {})
}

export function resolveChangedProfileFields(
  previousProfile: Partial<UserRow> | null | undefined,
  updates: Partial<UpdateProfileRequest>
): string[] {
  if (!previousProfile) {
    return Object.keys(updates)
  }

  return Object.entries(updates).reduce<string[]>((changedFields, [field, nextValue]) => {
    const previousValue = previousProfile[field as keyof UserRow]
    if (String(previousValue || '') !== String(nextValue || '')) {
      changedFields.push(field)
    }
    return changedFields
  }, [])
}

export function mapSubscriptionRecord(record: SubscriptionRecord): UserSubscription {
  return {
    subscription_id: record.subscription_id,
    subscription_type: record.subscription_type,
    subscription_status: record.subscription_status || '',
    price_cents: record.price_cents,
    start_date: record.start_date || '',
    end_date: record.end_date,
    next_billing_date: record.next_billing_date,
    course_id: record.course_id,
    course_title: record.courses?.title || null
  }
}

export function resolveProfileApiError(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === 'object' && payload !== null) {
    const maybeError = 'error' in payload && typeof payload.error === 'string' ? payload.error : null
    const maybeMessage = 'message' in payload && typeof payload.message === 'string' ? payload.message : null
    return maybeMessage || maybeError || fallbackMessage
  }

  return fallbackMessage
}

export function resolveProfileColors(
  userDashboardStyles: {
    card_background?: string | null
    sidebar_background?: string | null
    text_color?: string | null
    border_color?: string | null
    primary_button_color?: string | null
    accent_color?: string | null
  } | null | undefined
): ProfileColorPalette {
  const cardBackground = userDashboardStyles?.card_background || DEFAULT_PROFILE_COLORS.bgSecondary
  const normalizedCardBackground = cardBackground.toLowerCase()
  const isLightMode =
    normalizedCardBackground === '#ffffff' ||
    normalizedCardBackground === '#f8fafc' ||
    normalizedCardBackground.includes('255, 255, 255')

  let bgPrimary = userDashboardStyles?.sidebar_background || (isLightMode ? '#F1F5F9' : DEFAULT_PROFILE_COLORS.bgPrimary)
  let text = userDashboardStyles?.text_color || (isLightMode ? '#0F172A' : DEFAULT_PROFILE_COLORS.text)
  const border = userDashboardStyles?.border_color || (isLightMode ? '#E2E8F0' : DEFAULT_PROFILE_COLORS.border)

  if (isLightMode) {
    if (bgPrimary.toLowerCase() === '#0f1419' || bgPrimary.toLowerCase() === '#000000') {
      bgPrimary = '#F1F5F9'
    }

    if (text.toLowerCase() === '#ffffff' || text.toLowerCase() === '#fff') {
      text = '#0F172A'
    }
  }

  return {
    ...DEFAULT_PROFILE_COLORS,
    primary: userDashboardStyles?.primary_button_color || DEFAULT_PROFILE_COLORS.primary,
    accent: userDashboardStyles?.accent_color || DEFAULT_PROFILE_COLORS.accent,
    bgPrimary,
    bgSecondary: cardBackground,
    text,
    textSecondary: isLightMode ? '#64748B' : DEFAULT_PROFILE_COLORS.textSecondary,
    border
  }
}

export function formatProfileDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
