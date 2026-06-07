import type { AdminCompany } from '../../types/admin-companies.types'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_FONT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
} from './admin-companies.defaults'
import { normalizeBrandHexColor } from './admin-company-brand-colors'
import type {
  MapOrganizationOptions,
  OrganizationRow,
} from './admin-companies.mapper.types'
import { summarizeOrganizationMembership } from './admin-companies.membership.mapper'

export function mapOrganizationRow(
  row: OrganizationRow,
  options: MapOrganizationOptions = {},
): AdminCompany {
  const organizationUsers = row.organization_users ?? []
  const memberRoles = options.memberRoles ? new Set(options.memberRoles) : undefined
  const membershipSummary = summarizeOrganizationMembership(
    organizationUsers,
    options.usersMap,
    memberRoles,
  )

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
