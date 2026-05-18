import { createClient } from '../../../../lib/supabase/server'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { logger } from '../../../../lib/utils/logger'

import type {
  AdminCompany,
  AdminCompanyUserProfile,
} from '../../types/admin-companies.types'
import {
  mapOrganizationRow,
  type OrganizationRow,
} from './admin-companies.mapper'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type UserProfileRow = Omit<AdminCompanyUserProfile, 'email'> & { email: string | null }

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
  return Array.from(
    new Set(
      organizations.flatMap((organization) =>
        (organization.organization_users || []).map((membership) => membership.user_id)
      )
    )
  )
}

export async function getAdminCompanies(): Promise<AdminCompany[]> {
  const supabase = await createClient()
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
      pendingInvitationCount: invitationCountsMap[organization.id] || 0,
    })
  )
}

export async function getAdminCompanyById(id: string): Promise<AdminCompany | null> {
  const supabase = await createClient()
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
  const userIds = Array.from(
    new Set((organization.organization_users || []).map((membership) => membership.user_id))
  )

  const [usersMap, pendingInvitationsResponse, bulkInviteLinksResponse] = await Promise.all([
    buildUsersMap(supabase, userIds),
    supabase
      .from('user_invitations')
      .select(SELECT_COLUMNS.user_invitations)
      .eq('organization_id', id)
      .eq('status', 'pending'),
    fromLoose<Record<string, unknown>>(supabase, 'bulk_invite_links')
      .select(SELECT_COLUMNS.bulk_invite_links)
      .eq('organization_id', id),
  ])

  return mapOrganizationRow(organization, {
    usersMap,
    pendingInvitationCount: pendingInvitationsResponse.data?.length || 0,
    pendingInvitations: pendingInvitationsResponse.data || [],
    bulkInviteLinks: bulkInviteLinksResponse.data || [],
  })
}
