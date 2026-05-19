import type { PrivacyDeletionRequestsTable } from './privacy-deletion-requests.table'
import type { PrivacyDeletionTombstonesTable } from './privacy-deletion-tombstones.table'
import type { SecurityAuditLogTable } from './security-audit-log.table'
import type { UserMfaFactorsTable } from './user-mfa-factors.table'
import type { WorkTeamsTable } from './work-teams.table'

export type PublicTablesGroup06 = {
  privacy_deletion_requests: PrivacyDeletionRequestsTable
  privacy_deletion_tombstones: PrivacyDeletionTombstonesTable
  security_audit_log: SecurityAuditLogTable
  user_mfa_factors: UserMfaFactorsTable
  work_teams: WorkTeamsTable
}
