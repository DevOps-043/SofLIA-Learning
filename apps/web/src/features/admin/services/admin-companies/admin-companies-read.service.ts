import { createAdminClient } from '../../../../lib/supabase/admin'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { logger } from '../../../../lib/utils/logger'

import type {
  AdminCompany,
  AdminCompanyMember,
  AdminCompanyUserProfile,
} from '../../types/admin-companies.types'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_FONT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
} from './admin-companies.defaults'
import { normalizeBrandHexColor } from './admin-company-brand-colors'
import {
  mapOrganizationRow,
  type OrganizationRow,
} from './admin-companies.mapper'

type SupabaseServerClient = ReturnType<typeof createAdminClient>
type UserProfileRow = Omit<AdminCompanyUserProfile, 'email'> & { email: string | null }

const COMPANY_MEMBER_PROFILE_ROLES = ['owner', 'admin']

interface AdminCompanyOverviewRow {
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
  is_active: boolean | null
  max_users: number | null
  google_login_enabled: boolean | null
  microsoft_login_enabled: boolean | null
  created_at: string | null
  updated_at: string | null
  total_users: number | string | null
  active_users: number | string | null
  invited_users: number | string | null
  suspended_users: number | string | null
  members: AdminCompanyMember[] | null
}

interface AdminCompaniesOverviewRpcClient {
  rpc(
    fn: 'get_admin_companies_overview',
    args?: Record<string, never>,
  ): PromiseLike<{
    data: AdminCompanyOverviewRow[] | null
    error: { message?: string } | null
  }>
}

const ORGANIZATION_SELECT = `
  id,
  name,
  slug,
  description,
  logo_url,
  brand_logo_url,
  brand_banner_url,
  brand_favicon_url,
  brand_color_primary,
  brand_color_secondary,
  brand_color_accent,
  brand_font_family,
  contact_email,
  contact_phone,
  website_url,
  subscription_plan,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  is_active,
  max_users,
  google_login_enabled,
  microsoft_login_enabled,
  created_at,
  updated_at,
  organization_users (
    id,
    user_id,
    role,
    status,
    joined_at
  )
`

const USER_INVITATIONS_SELECT = 'id, email, token, role, organization_id, status, expires_at, created_at, created_by, accepted_at, metadata'
const BULK_INVITE_LINKS_SELECT = 'id, organization_id, created_by, token, name, max_uses, current_uses, role, expires_at, status, metadata, created_at, updated_at'

function toCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapAdminCompanyOverviewRow(row: AdminCompanyOverviewRow): AdminCompany {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo_url: row.logo_url,
    brand_logo_url: row.brand_logo_url,
    brand_banner_url: row.brand_banner_url,
    brand_favicon_url: row.brand_favicon_url,
    brand_color_primary: normalizeBrandHexColor(row.brand_color_primary, DEFAULT_BRAND_PRIMARY),
    brand_color_secondary: normalizeBrandHexColor(row.brand_color_secondary, DEFAULT_BRAND_SECONDARY),
    brand_color_accent: normalizeBrandHexColor(row.brand_color_accent, DEFAULT_BRAND_ACCENT),
    brand_font_family: row.brand_font_family ?? DEFAULT_BRAND_FONT,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    website_url: row.website_url,
    subscription_plan: row.subscription_plan,
    subscription_status: row.subscription_status,
    subscription_start_date: row.subscription_start_date,
    subscription_end_date: row.subscription_end_date,
    is_active: row.is_active ?? true,
    max_users: row.max_users,
    total_users: toCount(row.total_users),
    active_users: toCount(row.active_users),
    invited_users: toCount(row.invited_users),
    suspended_users: toCount(row.suspended_users),
    google_login_enabled: row.google_login_enabled ?? false,
    microsoft_login_enabled: row.microsoft_login_enabled ?? false,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    members: Array.isArray(row.members) ? row.members : [],
  }
}

async function loadAdminCompaniesOverview(
  supabase: SupabaseServerClient,
): Promise<AdminCompany[] | null> {
  const { data, error } = await (
    supabase as unknown as AdminCompaniesOverviewRpcClient
  ).rpc('get_admin_companies_overview', {})

  if (error) {
    logger.warn('Admin companies overview RPC unavailable, using fallback', {
      error: error.message,
    })
    return null
  }

  return (data || []).map(mapAdminCompanyOverviewRow)
}

async function buildUsersMap(
  supabase: SupabaseServerClient,
  userIds: string[]
): Promise<Map<string, AdminCompanyUserProfile>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, username, first_name, last_name, display_name, profile_picture_url')
    .in('id', userIds)

  const usersMap = new Map<string, AdminCompanyUserProfile>()
  usersData?.forEach((user: UserProfileRow) => {
    usersMap.set(user.id, {
      ...user,
      email: user.email ?? '',
    })
  })

  return usersMap
}

async function buildPendingInvitationCountMap(
  supabase: SupabaseServerClient,
  organizationIds: string[]
): Promise<Record<string, number>> {
  if (organizationIds.length === 0) {
    return {}
  }

  const { data: invitations } = await supabase
    .from('user_invitations')
    .select('organization_id')
    .eq('status', 'pending')
    .in('organization_id', organizationIds)

  const invitationCounts: Record<string, number> = {}

  ;(invitations || []).forEach((invitation: { organization_id: string }) => {
    invitationCounts[invitation.organization_id] = (invitationCounts[invitation.organization_id] || 0) + 1
  })

  return invitationCounts
}

function collectOrganizationUserIds(organizations: OrganizationRow[]): string[] {
  const profileRoles = new Set(COMPANY_MEMBER_PROFILE_ROLES)

  return Array.from(
    new Set(
      organizations.flatMap((organization) =>
        (organization.organization_users || [])
          .filter((membership) => membership.role && profileRoles.has(membership.role))
          .map((membership) => membership.user_id)
      )
    )
  )
}

export async function getAdminCompanies(): Promise<AdminCompany[]> {
  const supabase = createAdminClient()
  const companiesOverview = await loadAdminCompaniesOverview(supabase)
  if (companiesOverview) {
    return companiesOverview
  }

  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching organizations:', error)
    throw error
  }

  const organizations = (data as OrganizationRow[] | null) ?? []
  if (organizations.length === 0) {
    return []
  }

  const organizationIds = organizations.map((organization) => organization.id)
  const userIds = collectOrganizationUserIds(organizations)

  const [usersMap, invitationCountsMap] = await Promise.all([
    buildUsersMap(supabase, userIds),
    buildPendingInvitationCountMap(supabase, organizationIds),
  ])

  return organizations.map((organization) =>
    mapOrganizationRow(organization, {
      usersMap,
      memberRoles: COMPANY_MEMBER_PROFILE_ROLES,
      pendingInvitationCount: invitationCountsMap[organization.id] || 0,
    })
  )
}

export async function getAdminCompanyById(id: string): Promise<AdminCompany | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error fetching organization by id:', error)
    return null
  }

  if (!data) {
    return null
  }

  const organization = data as OrganizationRow
  const profileRoles = new Set(COMPANY_MEMBER_PROFILE_ROLES)
  const userIds = Array.from(
    new Set(
      (organization.organization_users || [])
        .filter((membership) => membership.role && profileRoles.has(membership.role))
        .map((membership) => membership.user_id)
    )
  )

  const [usersMap, pendingInvitationsResponse, bulkInviteLinksResponse] = await Promise.all([
    buildUsersMap(supabase, userIds),
    supabase
      .from('user_invitations')
      .select(USER_INVITATIONS_SELECT)
      .eq('organization_id', id)
      .eq('status', 'pending'),
    fromLoose<Record<string, unknown>>(supabase, 'bulk_invite_links')
      .select(BULK_INVITE_LINKS_SELECT)
      .eq('organization_id', id),
  ])

  return mapOrganizationRow(organization, {
    usersMap,
    memberRoles: COMPANY_MEMBER_PROFILE_ROLES,
    pendingInvitationCount: pendingInvitationsResponse.data?.length || 0,
    pendingInvitations: pendingInvitationsResponse.data || [],
    bulkInviteLinks: bulkInviteLinksResponse.data || [],
  })
}
