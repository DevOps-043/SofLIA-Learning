import type { Database } from '../../../lib/supabase/types'
import {
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '../../../lib/schemas/user-demographics.schema'
import { hexToRgbColor, resolveHexColor } from '../../../core/theme/color-engine'
import type {
  ProfileColorPalette,
  UpdateProfileRequest,
  UserProfile,
  UserStats,
  UserSubscription
} from '../types/profile.types'
import type { AuthOAuthProvider } from '../../auth/services/auth-account-method.service'

type UserRow = Database['public']['Tables']['users']['Row']
type UserProfileExtraFields = {
  auth_providers?: AuthOAuthProvider[] | null
  can_edit_credentials?: boolean | null
  phone_number?: string | null
  points?: number | null
  job_title?: string | null
  job_description?: string | null
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
export const PROFILE_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024

// Resolves any color value (CSS var, hex, rgba string) to a luminance value [0,1].
// Returns true for colors with perceived luminance > 0.6 (light backgrounds).
function isLightBackgroundColor(colorValue: string): boolean {
  const resolved = resolveHexColor(colorValue)
  if (resolved) {
    const rgb = hexToRgbColor(resolved)
    if (rgb) {
      return (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) / 255 > 0.6
    }
  }

  // Fallback for non-hex formats (e.g. rgba strings)
  const lower = colorValue.toLowerCase()
  return (
    lower === 'var(--color-bg-light)' ||
    lower === 'var(--color-gray-50)' ||
    lower.includes('255, 255, 255')
  )
}

export const DEFAULT_PROFILE_COLORS: ProfileColorPalette = {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  bgPrimary: 'var(--color-bg-dark)',
  bgSecondary: 'var(--color-gray-800)',
  bgTertiary: 'var(--color-gray-950)',
  grayLight: 'var(--color-gray-200)',
  grayMedium: 'var(--color-gray-500)',
  text: 'var(--color-bg-light)',
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
    job_title: data.job_title || '',
    job_description: data.job_description || '',
    profile_picture_url: data.profile_picture_url || '',
    country_code: data.country_code || '',
    date_of_birth: data.date_of_birth || null,
    gender: normalizeGenderForStorage(data.gender),
    points: data.points || 0,
    created_at: data.created_at,
    last_login_at: data.last_login_at || data.created_at,
    email_verified: data.email_verified || false,
    auth_providers: data.auth_providers || [],
    can_edit_credentials: data.can_edit_credentials ?? true
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
    'cargo_rol',
    'type_rol',
    'profile_picture_url',
    'country_code',
    'date_of_birth',
    'gender',
  ]

  return allowedFields.reduce<Partial<UpdateProfileRequest>>((accumulator, field) => {
    if (updates[field] !== undefined) {
      accumulator[field] = (
        field === 'date_of_birth'
          ? normalizeDateOfBirthForStorage(updates[field] as string | null | undefined)
          : field === 'gender'
            ? normalizeGenderForStorage(updates[field] as string | null | undefined)
            : updates[field]
      ) as never
    }
    return accumulator
  }, {})
}

export function pickAllowedOrganizationProfileUpdates(
  updates: UpdateProfileRequest
): Pick<UpdateProfileRequest, 'job_title' | 'job_description'> {
  const organizationUpdates: Pick<UpdateProfileRequest, 'job_title' | 'job_description'> = {}

  if (updates.job_title !== undefined) {
    organizationUpdates.job_title = updates.job_title
  }

  if (updates.job_description !== undefined) {
    organizationUpdates.job_description = updates.job_description
  }

  return organizationUpdates
}

export function createProfileUpdateRequest(profile: UserProfile): UpdateProfileRequest {
  return {
    username: profile.username,
    first_name: profile.first_name,
    last_name: profile.last_name,
    display_name: profile.display_name,
    phone: profile.phone,
    bio: profile.bio,
    location: profile.location,
    cargo_rol: profile.cargo_rol,
    type_rol: profile.type_rol,
    job_title: profile.job_title,
    job_description: profile.job_description,
    profile_picture_url: profile.profile_picture_url,
    country_code: profile.country_code,
    date_of_birth: profile.date_of_birth,
    gender: profile.gender,
  }
}

export function resolveChangedOrganizationProfileFields(
  previousMembership: { job_title?: string | null; job_description?: string | null } | null | undefined,
  updates: Pick<UpdateProfileRequest, 'job_title' | 'job_description'>
): string[] {
  return Object.entries(updates).reduce<string[]>((changedFields, [field, nextValue]) => {
    const previousValue = previousMembership?.[field as 'job_title' | 'job_description']
    if (String(previousValue || '') !== String(nextValue || '')) {
      changedFields.push(field)
    }
    return changedFields
  }, [])
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
  const isLightMode = isLightBackgroundColor(cardBackground)

  let bgPrimary = userDashboardStyles?.sidebar_background || (isLightMode ? 'var(--color-gray-100)' : DEFAULT_PROFILE_COLORS.bgPrimary)
  let text = userDashboardStyles?.text_color || (isLightMode ? 'var(--color-legacy-0f172a)' : DEFAULT_PROFILE_COLORS.text)
  const border = userDashboardStyles?.border_color || (isLightMode ? 'var(--color-gray-200)' : DEFAULT_PROFILE_COLORS.border)

  if (isLightMode) {
    if (bgPrimary.toLowerCase() === 'var(--color-bg-dark)' || bgPrimary.toLowerCase() === 'var(--color-black)') {
      bgPrimary = 'var(--color-gray-100)'
    }

    if (text.toLowerCase() === 'var(--color-bg-light)' || text.toLowerCase() === 'var(--color-bg-light)') {
      text = 'var(--color-legacy-0f172a)'
    }
  }

  return {
    ...DEFAULT_PROFILE_COLORS,
    primary: userDashboardStyles?.primary_button_color || DEFAULT_PROFILE_COLORS.primary,
    accent: userDashboardStyles?.accent_color || DEFAULT_PROFILE_COLORS.accent,
    bgPrimary,
    bgSecondary: cardBackground,
    text,
    textSecondary: isLightMode ? 'var(--color-gray-500)' : DEFAULT_PROFILE_COLORS.textSecondary,
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
