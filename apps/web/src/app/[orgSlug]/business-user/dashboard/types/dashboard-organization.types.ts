export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  favicon_url?: string | null
  show_navbar_name?: boolean
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'superadmin' | null

export interface BusinessUserDashboardIdentity {
  first_name?: string
  last_name?: string
  display_name?: string
  username?: string
}
