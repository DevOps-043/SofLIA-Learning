import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  resolveBrandHexColor,
} from '../../services/admin-companies/admin-company-brand-colors'

const colors = SOFLIA_ADMIN_COLORS
const legacyColor = (token: string, fallback: string) =>
  resolveBrandHexColor(token) ?? fallback

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
  {
    id: 'SOFLIA',
    name: 'SOFLIA Default',
    primary: DEFAULT_BRAND_PRIMARY,
    secondary: DEFAULT_BRAND_SECONDARY,
    accent: DEFAULT_BRAND_ACCENT,
    description: 'Tema profesional',
  },
  {
    id: 'modern-blue',
    name: 'Moderno Azul',
    primary: DESIGN_HEX_COLOR.blue800,
    secondary: DESIGN_HEX_COLOR.blue900,
    accent: DESIGN_HEX_COLOR.info,
    description: 'Azul corporativo',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    primary: legacyColor('var(--color-legacy-065f46)', DESIGN_HEX_COLOR.success),
    secondary: legacyColor('var(--color-legacy-064e3b)', DESIGN_HEX_COLOR.success),
    accent: DESIGN_HEX_COLOR.success,
    description: 'Verde empresarial',
  },
  {
    id: 'purple',
    name: 'Violeta',
    primary: legacyColor('var(--color-legacy-4c1d95)', DESIGN_HEX_COLOR.secondary),
    secondary: legacyColor('var(--color-legacy-5b21b6)', DESIGN_HEX_COLOR.secondary),
    accent: DESIGN_HEX_COLOR.secondary,
    description: 'Morado elegante',
  },
  {
    id: 'rose',
    name: 'Rosa',
    primary: legacyColor('var(--color-legacy-9f1239)', DESIGN_HEX_COLOR.error),
    secondary: legacyColor('var(--color-legacy-881337)', DESIGN_HEX_COLOR.error),
    accent: legacyColor('var(--color-legacy-f43f5e)', DESIGN_HEX_COLOR.error),
    description: 'Rosa vibrante',
  },
  {
    id: 'amber',
    name: 'Ambar',
    primary: legacyColor('var(--color-legacy-92400e)', DESIGN_HEX_COLOR.warning),
    secondary: legacyColor('var(--color-legacy-78350f)', DESIGN_HEX_COLOR.warning),
    accent: DESIGN_HEX_COLOR.warning,
    description: 'Naranja calido',
  },
]

export const BRANDING_COLOR_FIELDS: Array<{ k: BrandingColorKey; l: string }> = [
  { k: 'brand_color_primary', l: 'Primario' },
  { k: 'brand_color_secondary', l: 'Secundario' },
  { k: 'brand_color_accent', l: 'Acento' },
]
