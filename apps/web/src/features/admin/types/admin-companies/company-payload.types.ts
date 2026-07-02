export interface CompanyUpdatePayload {
  name?: string
  slug?: string | null
  description?: string | null
  logo_url?: string | null
  brand_logo_url?: string | null
  brand_banner_url?: string | null
  brand_favicon_url?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
  branding_enabled?: boolean
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  is_active?: boolean
  subscription_status?: string
  subscription_plan?: string
  max_users?: number
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
}

export interface CompanyCreatePayload {
  name: string
  slug?: string
  description?: string
  contact_email?: string
  contact_phone?: string
  website_url?: string
  subscription_plan?: string
  subscription_status?: string
  max_users?: number
  is_active?: boolean
  brand_logo_url?: string
  brand_banner_url?: string
  brand_favicon_url?: string
  brand_color_primary?: string
  brand_color_secondary?: string
  brand_color_accent?: string
  brand_font_family?: string
  branding_enabled?: boolean
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
  owner_email?: string
  owner_position?: string
}
