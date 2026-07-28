import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
} from '../../services/admin-companies/admin-company-brand-colors'
import type { CreateCompanyData, PlanOption } from './types'

const colors = SOFLIA_ADMIN_COLORS
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PLAN_OPTIONS: PlanOption[] = [
  {
    value: 'team',
    label: 'Team',
    color: colors.info,
    description: 'Hasta 10 usuarios',
  },
  {
    value: 'business',
    label: 'Business',
    color: colors.purple,
    description: 'Hasta 50 usuarios',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    color: colors.warning,
    description: 'Usuarios ilimitados',
  },
]

export function createInitialCompanyData(): CreateCompanyData {
  return {
    name: '',
    slug: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    subscription_plan: 'team',
    max_users: 10,
    is_active: true,
    brand_logo_url: '',
    brand_banner_url: '',
    brand_favicon_url: '',
    brand_color_primary: DEFAULT_BRAND_PRIMARY,
    brand_color_secondary: DEFAULT_BRAND_SECONDARY,
    brand_color_accent: DEFAULT_BRAND_ACCENT,
    brand_font_family: 'Inter Tight',
    google_login_enabled: false,
    microsoft_login_enabled: false,
    owner_email: '',
    owner_position: '',
  }
}

export function createCompanySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getSelectedPlan(planValue: string): PlanOption {
  return PLAN_OPTIONS.find((plan) => plan.value === planValue) || PLAN_OPTIONS[0]
}

export function isCreateCompanyFormValid(formData: CreateCompanyData): boolean {
  return (
    formData.name.trim().length > 0 &&
    Boolean(formData.owner_email) &&
    EMAIL_PATTERN.test(formData.owner_email!.trim())
  )
}

export function updateCompanyColor(
  formData: CreateCompanyData,
  key:
    | 'brand_color_primary'
    | 'brand_color_secondary'
    | 'brand_color_accent',
  value: string,
): CreateCompanyData {
  return {
    ...formData,
    [key]: value,
  }
}
