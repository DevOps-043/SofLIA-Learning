import { logger } from '../logger'

export type SecurityEventType =
  | 'automated-sensitive-access'
  | 'automation-challenge-required'
  | 'automation-signal-received'
  | 'agent-honeypot-hit'
  | 'prompt-injection-blocked'
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
  logger.info(`Security event: ${type}`, {
    ...details,
    ip: normalizeIp(details.ip),
  })
}
