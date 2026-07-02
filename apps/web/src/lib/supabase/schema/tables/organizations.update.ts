import type { Json } from '../json'

export type OrganizationsUpdate = {
  billing_cycle?: string | null
  brand_banner_url?: string | null
  brand_color_accent?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_favicon_url?: string | null
  brand_font_family?: string | null
  brand_logo_url?: string | null
  branding_enabled?: boolean | null
  company_country?: string | null
  company_mission?: string | null
  company_size?: string | null
  company_type?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  created_at?: string | null
  description?: string | null
  google_login_enabled?: boolean | null
  id?: string
  industry?: string | null
  is_active?: boolean | null
  login_styles?: Json | null
  logo_url?: string | null
  max_users?: number | null
  microsoft_login_enabled?: boolean | null
  name?: string
  panel_styles?: Json | null
  selected_theme?: string | null
  show_navbar_name?: boolean | null
  slug?: string
  subscription_end_date?: string | null
  subscription_plan?: string | null
  subscription_start_date?: string | null
  subscription_status?: string | null
  updated_at?: string | null
  user_dashboard_styles?: Json | null
  website_url?: string | null
}
