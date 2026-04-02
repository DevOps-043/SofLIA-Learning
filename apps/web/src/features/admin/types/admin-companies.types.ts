export interface AdminCompanyUserProfile {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
}

export interface AdminCompanyMember {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  user?: AdminCompanyUserProfile
}

export interface AdminCompany {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  brand_logo_url: string | null
  brand_banner_url: string | null
  brand_favicon_url: string | null
  brand_color_primary: string | null
  brand_color_secondary: string | null
  brand_color_accent: string | null
  brand_font_family: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean
  max_users: number | null
  total_users: number
  active_users: number
  invited_users: number
  suspended_users: number
  google_login_enabled: boolean
  microsoft_login_enabled: boolean
  created_at: string
  updated_at: string
  members: AdminCompanyMember[]
  pending_invitations?: Record<string, unknown>[]
  bulk_invite_links?: Record<string, unknown>[]
}

export interface CompanyStats {
  totalCompanies: number
  activeCompanies: number
  trialCompanies: number
  pausedCompanies: number
  pendingCompanies: number
  totalSeats: number
  usedSeats: number
  averageUtilization: number
}

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
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
  owner_email?: string
  owner_position?: string
}

export interface CompanyDetailedStatsOverview {
  totalUsers: number
  activeUsers: number
  invitedUsers: number
  assignedCourses: number
  totalLearningHours: number
  totalSessions: number
  engagementRate: number
  avgSatisfaction: number
}

export interface CompanyDetailedStatsMonthlyActivity {
  month: string
  hours: number
  sessions: number
}

export interface CompanyDetailedStatsCourseProgress {
  id: string
  title: string
  averageProgress: number
  enrolledCount: number
  completedCount: number
}

export interface CompanyDetailedStatsTeamDistribution {
  name: string
  value: number
}

export interface CompanyDetailedStats {
  overview: CompanyDetailedStatsOverview
  activityMonthly: CompanyDetailedStatsMonthlyActivity[]
  courseProgress: CompanyDetailedStatsCourseProgress[]
  teamDistribution: CompanyDetailedStatsTeamDistribution[]
}
