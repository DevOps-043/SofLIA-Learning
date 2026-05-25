import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'

const colors = SOFLIA_ADMIN_COLORS

export { colors }

export type EditTab = 'general' | 'members' | 'branding' | 'themes'
export type BrandingColorKey = 'brand_color_primary' | 'brand_color_secondary' | 'brand_color_accent'

export interface CompanyFormData {
  name: string
  slug: string
  description: string
  contact_email: string
  contact_phone: string
  website_url: string
  subscription_plan: string
  max_users: number
  is_active: boolean
  brand_logo_url: string
  brand_banner_url: string
  brand_favicon_url: string
  brand_color_primary: string
  brand_color_secondary: string
  brand_color_accent: string
  brand_font_family: string
}

export const PLAN_OPTIONS = [
  { value: 'team', label: 'Team', color: colors.info, description: 'Hasta 10 usuarios' },
  { value: 'business', label: 'Business', color: colors.purple, description: 'Hasta 50 usuarios' },
  { value: 'enterprise', label: 'Enterprise', color: colors.warning, description: 'Usuarios ilimitados' },
]

export const THEME_PRESETS = [
  { id: 'SOFLIA', name: 'SOFLIA Default', primary: colors.primary, secondary: colors.bgSecondary, accent: colors.accent, description: 'Tema profesional' },
  { id: 'modern-blue', name: 'Moderno Azul', primary: 'var(--color-legacy-1e40af)', secondary: 'var(--color-legacy-1e3a8a)', accent: colors.info, description: 'Azul corporativo' },
  { id: 'emerald', name: 'Esmeralda', primary: 'var(--color-legacy-065f46)', secondary: 'var(--color-legacy-064e3b)', accent: colors.success, description: 'Verde empresarial' },
  { id: 'purple', name: 'Violeta', primary: 'var(--color-legacy-4c1d95)', secondary: 'var(--color-legacy-5b21b6)', accent: colors.purple, description: 'Morado elegante' },
  { id: 'rose', name: 'Rosa', primary: 'var(--color-legacy-9f1239)', secondary: 'var(--color-legacy-881337)', accent: 'var(--color-legacy-f43f5e)', description: 'Rosa vibrante' },
  { id: 'amber', name: 'Ámbar', primary: 'var(--color-legacy-92400e)', secondary: 'var(--color-legacy-78350f)', accent: colors.warning, description: 'Naranja cálido' },
]

export const BRANDING_COLOR_FIELDS: Array<{ k: BrandingColorKey; l: string }> = [
  { k: 'brand_color_primary', l: 'Primario' },
  { k: 'brand_color_secondary', l: 'Secundario' },
  { k: 'brand_color_accent', l: 'Acento' },
]
