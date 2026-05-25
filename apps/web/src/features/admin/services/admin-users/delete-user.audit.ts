import { AuditLogService } from '../auditLog.service'
import type { AdminUserRequestInfo } from './types'

export async function logUserDeleteAttempt(
  userId: string,
  adminUserId: string,
  userData: unknown,
  requestInfo?: AdminUserRequestInfo,
) {
  try {
    await AuditLogService.logAction({
      user_id: userId,
      admin_user_id: adminUserId,
      action: 'DELETE',
      table_name: 'users',
      record_id: userId,
      old_values: (userData as Record<string, unknown>) || undefined,
      new_values: undefined,
      ip_address: requestInfo?.ip,
      user_agent: requestInfo?.userAgent,
    })
  } catch {
    // Audit log failure should not block deletion.
  }
}
