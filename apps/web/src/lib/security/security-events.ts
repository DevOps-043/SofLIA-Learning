import { logger } from '../logger'
import type { SecurityAuditResult } from './security-audit-log'

export type SecurityEventType =
  | 'automated-sensitive-access'
  | 'automation-challenge-required'
  | 'automation-signal-received'
  | 'agent-honeypot-hit'
  | 'admin-operation'
  | 'access-denied'
  | 'cors-denied'
  | 'csp-violation'
  | 'file-upload-rejected'
  | 'login-failure'
  | 'login-success'
  | 'privacy-deletion-requested'
  | 'privacy-export'
  | 'prompt-injection-blocked'
  | 'rate-limit-triggered'
  | 'registration-failure'
  | 'registration-success'
  | 'password-reset-request'
  | 'safe-fetch-blocked'
  | 'security-response-rewritten'
  | 'trusted-agent-authenticated'
  | 'trusted-agent-auth-failed'
  | 'trusted-agent-handshake-issued'
  | 'verification-failed'
  | 'verification-passed'

export interface SecurityEventDetails {
  pathname?: string
  method?: string
  userAgent?: string
  ip?: string
  actorId?: string | null
  actorRole?: string | null
  orgId?: string | null
  resourceType?: string | null
  resourceId?: string | null
  result?: SecurityAuditResult
  reasons?: string[]
  metadata?: Record<string, unknown>
}

function normalizeIp(ip?: string | null) {
  if (!ip) {
    return undefined
  }

  return ip.split(',')[0]?.trim() || undefined
}

export function recordSecurityEvent(
  type: SecurityEventType,
  details: SecurityEventDetails = {},
) {
  const result = details.result ?? inferResult(type)

  logger.info(`Security event: ${type}`, {
    ...details,
    ip: normalizeIp(details.ip),
    result,
  })

  void import('./security-audit-log')
    .then(({ writeSecurityAuditLogAsync }) => {
      writeSecurityAuditLogAsync({
        action: type,
        actorId: details.actorId,
        actorRole: details.actorRole,
        orgId: details.orgId,
        resourceType: details.resourceType,
        resourceId: details.resourceId,
        ip: details.ip,
        userAgent: details.userAgent,
        result,
        metadata: {
          pathname: details.pathname,
          method: details.method,
          reasons: details.reasons,
          ...details.metadata,
        },
      })
    })
    .catch(() => undefined)
}

function inferResult(type: SecurityEventType): SecurityAuditResult {
  if (
    type.includes('failed') ||
    type.includes('blocked') ||
    type.includes('denied') ||
    type === 'automated-sensitive-access' ||
    type === 'safe-fetch-blocked' ||
    type === 'file-upload-rejected'
  ) {
    return 'denied'
  }

  if (type.includes('error')) {
    return 'error'
  }

  return 'success'
}
