import type {
  BulkInviteLinkRecord,
  BulkInviteLinkRow,
  InvitationRecord,
  OrganizationRow,
  OrganizationSummary,
  UserInvitationRow,
} from '../types'

export function normalizeOrganizationSummary(
  organization?: OrganizationRow | OrganizationRow[] | null
): OrganizationSummary | null {
  const row = Array.isArray(organization) ? organization[0] : organization

  if (!row) {
    return null
  }

  return {
    id: row.id,
    logoUrl: row.logo_url ?? null,
    name: row.name ?? null,
    slug: row.slug ?? null,
  }
}

export function toInvitationRecord(row: UserInvitationRow): InvitationRecord {
  return {
    createdAt: row.created_at ?? null,
    email: row.email,
    expiresAt: row.expires_at,
    id: row.id,
    metadata: row.metadata ?? null,
    organization: normalizeOrganizationSummary(row.organizations),
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
    token: row.token,
  }
}

export function toBulkInviteLinkRecord(
  row: BulkInviteLinkRow
): BulkInviteLinkRecord {
  return {
    currentUses: row.current_uses ?? null,
    expiresAt: row.expires_at,
    id: row.id,
    maxUses: row.max_uses ?? null,
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
  }
}
