import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseServerClient = ReturnType<typeof createAdminClient>

interface OrganizationMembershipRow {
  created_at: string | null
  joined_at: string | null
  organization_id: string
  status: string | null
  user_id: string
}

function resolveMembershipSortValue(row: OrganizationMembershipRow): number {
  const timestamp = row.joined_at || row.created_at
  if (!timestamp) {
    return 0
  }

  const parsed = Date.parse(timestamp)
  return Number.isNaN(parsed) ? 0 : parsed
}

function resolveMembershipStatusPriority(status: string | null): number {
  if (status === 'active') {
    return 2
  }

  if (!status) {
    return 1
  }

  return 0
}

export async function loadPrimaryOrganizationIdsMap(
  supabase: SupabaseServerClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const normalizedUserIds = [...new Set(userIds.filter((value) => value.trim().length > 0))]

  if (normalizedUserIds.length === 0) {
    return new Map<string, string>()
  }

  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id, organization_id, joined_at, created_at, status')
    .in('user_id', normalizedUserIds)

  if (error) {
    throw error
  }

  const latestMembershipByUser = new Map<string, OrganizationMembershipRow>()

  for (const row of (data || []) as OrganizationMembershipRow[]) {
    const previous = latestMembershipByUser.get(row.user_id)

    if (!previous) {
      latestMembershipByUser.set(row.user_id, row)
      continue
    }

    const nextPriority = resolveMembershipStatusPriority(row.status)
    const previousPriority = resolveMembershipStatusPriority(previous.status)

    if (nextPriority > previousPriority) {
      latestMembershipByUser.set(row.user_id, row)
      continue
    }

    if (
      nextPriority === previousPriority &&
      resolveMembershipSortValue(row) > resolveMembershipSortValue(previous)
    ) {
      latestMembershipByUser.set(row.user_id, row)
    }
  }

  return new Map(
    [...latestMembershipByUser.entries()].map(([userId, membership]) => [userId, membership.organization_id]),
  )
}

export async function getPrimaryOrganizationIdForUser(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const primaryOrganizations = await loadPrimaryOrganizationIdsMap(supabase, [userId])
  return primaryOrganizations.get(userId) || null
}

export async function hasActiveOrganizationMembership(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

export function resolveEffectiveOrganizationId(input: {
  certificateOrganizationId?: string | null
  enrollmentId?: string | null
  enrollmentOrganizations?: Map<string, string | null>
  primaryOrganizations?: Map<string, string>
  userId: string
}): string | null {
  if (input.enrollmentId && input.enrollmentOrganizations?.has(input.enrollmentId)) {
    const enrollmentOrganizationId = input.enrollmentOrganizations.get(input.enrollmentId)
    return (
      enrollmentOrganizationId ||
      input.certificateOrganizationId ||
      input.primaryOrganizations?.get(input.userId) ||
      null
    )
  }

  if (input.certificateOrganizationId) {
    return input.certificateOrganizationId
  }

  return input.primaryOrganizations?.get(input.userId) || null
}
