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
  { id: 'modern-blue', name: 'Moderno Azul', primary: '#1E40AF', secondary: '#1E3A8A', accent: colors.info, description: 'Azul corporativo' },
  { id: 'emerald', name: 'Esmeralda', primary: '#065F46', secondary: '#064E3B', accent: colors.success, description: 'Verde empresarial' },
  { id: 'purple', name: 'Violeta', primary: '#4C1D95', secondary: '#5B21B6', accent: colors.purple, description: 'Morado elegante' },
  { id: 'rose', name: 'Rosa', primary: '#9F1239', secondary: '#881337', accent: '#F43F5E', description: 'Rosa vibrante' },
  { id: 'amber', name: 'Ámbar', primary: '#92400E', secondary: '#78350F', accent: colors.warning, description: 'Naranja cálido' },
]

export const BRANDING_COLOR_FIELDS: Array<{ k: BrandingColorKey; l: string }> = [
  { k: 'brand_color_primary', l: 'Primario' },
  { k: 'brand_color_secondary', l: 'Secundario' },
  { k: 'brand_color_accent', l: 'Acento' },
]
