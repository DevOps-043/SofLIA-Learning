import type {
  AdminCompany,
  AdminCompanyMember,
  AdminCompanyUserProfile,
} from '../../types/admin-companies.types'

export interface OrganizationUserProfileRow {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
}

export interface OrganizationUserRow {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  users?: OrganizationUserProfileRow | null
}

export interface OrganizationRow {
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
  created_at: string | null
  updated_at: string | null
  google_login_enabled: boolean | null
  microsoft_login_enabled: boolean | null
  organization_users?: OrganizationUserRow[] | null
}

interface OrganizationMembershipSummary {
  activeUsers: number
  invitedUsers: number
  suspendedUsers: number
  totalUsers: number
  members: AdminCompanyMember[]
}

const DEFAULT_BRAND_PRIMARY = '#3b82f6'
const DEFAULT_BRAND_SECONDARY = '#10b981'
const DEFAULT_BRAND_ACCENT = '#8b5cf6'
const DEFAULT_BRAND_FONT = 'Inter'

export function mapOrganizationUserProfile(
  user: OrganizationUserProfileRow | null | undefined
): AdminCompanyUserProfile | undefined {
  if (!user) {
    return undefined
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    profile_picture_url: user.profile_picture_url,
  }
}

function summarizeOrganizationMembership(
  organizationUsers: OrganizationUserRow[],
  usersMap?: Map<string, AdminCompanyUserProfile>
): OrganizationMembershipSummary {
  return organizationUsers.reduce<OrganizationMembershipSummary>(
    (summary, membership) => {
      const resolvedUser = usersMap?.get(membership.user_id) ?? mapOrganizationUserProfile(membership.users)

      summary.totalUsers += 1

      if (membership.status === 'active') {
        summary.activeUsers += 1
      } else if (membership.status === 'invited') {
        summary.invitedUsers += 1
      } else if (membership.status === 'suspended') {
        summary.suspendedUsers += 1
      }

      summary.members.push({
        id: membership.id,
        user_id: membership.user_id,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
        user: resolvedUser,
      })

      return summary
    },
    {
      activeUsers: 0,
      invitedUsers: 0,
      suspendedUsers: 0,
      totalUsers: 0,
      members: [],
    }
  )
}

interface MapOrganizationOptions {
  usersMap?: Map<string, AdminCompanyUserProfile>
  pendingInvitationCount?: number
  pendingInvitations?: Record<string, unknown>[]
  bulkInviteLinks?: Record<string, unknown>[]
}

export function mapOrganizationRow(
  row: OrganizationRow,
  options: MapOrganizationOptions = {}
): AdminCompany {
  const organizationUsers = row.organization_users ?? []
  const membershipSummary = summarizeOrganizationMembership(organizationUsers, options.usersMap)

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo_url: row.logo_url,
    brand_logo_url: row.brand_logo_url,
    brand_banner_url: row.brand_banner_url,
    brand_favicon_url: row.brand_favicon_url,
    brand_color_primary: row.brand_color_primary ?? DEFAULT_BRAND_PRIMARY,
    brand_color_secondary: row.brand_color_secondary ?? DEFAULT_BRAND_SECONDARY,
    brand_color_accent: row.brand_color_accent ?? DEFAULT_BRAND_ACCENT,
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
    total_users: membershipSummary.totalUsers,
    active_users: membershipSummary.activeUsers,
    invited_users: membershipSummary.invitedUsers + (options.pendingInvitationCount ?? 0),
    suspended_users: membershipSummary.suspendedUsers,
    google_login_enabled: row.google_login_enabled ?? false,
    microsoft_login_enabled: row.microsoft_login_enabled ?? false,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    members: membershipSummary.members,
    pending_invitations: options.pendingInvitations,
    bulk_invite_links: options.bulkInviteLinks,
  }
}
