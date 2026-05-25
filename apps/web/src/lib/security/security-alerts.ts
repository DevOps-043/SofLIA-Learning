import { createHmac } from 'crypto'

export type SecurityAlertSeverity = 'medium' | 'high' | 'critical'

export interface SecurityAuditEventForAlerting {
  action: string
  actor_id?: string | null
  ip?: string | null
  occurred_at: string
  result: string
}

export interface SecurityAlert {
  code: string
  group: string
  observed: number
  severity: SecurityAlertSeverity
  threshold: number
  windowMinutes: number
}

type SecurityAlertRule = {
  action: string
  code: string
  groupBy: 'actor_id' | 'ip' | 'global'
  severity: SecurityAlertSeverity
  threshold: number
  windowMinutes: number
}

const ALERT_RULES: readonly SecurityAlertRule[] = [
  {
    action: 'login-failure',
    code: 'login_failure_burst',
    groupBy: 'ip',
    severity: 'high',
    threshold: 10,
    windowMinutes: 1,
  },
  {
    action: 'access-denied',
    code: 'access_denied_burst',
    groupBy: 'actor_id',
    severity: 'high',
    threshold: 5,
    windowMinutes: 1,
  },
  {
    action: 'csp-violation',
    code: 'csp_violation_spike',
    groupBy: 'global',
    severity: 'medium',
    threshold: 100,
    windowMinutes: 60,
  },
  {
    action: 'safe-fetch-blocked',
    code: 'ssrf_probe_burst',
    groupBy: 'ip',
    severity: 'critical',
    threshold: 3,
    windowMinutes: 15,
  },
  {
    action: 'file-upload-rejected',
    code: 'upload_rejection_burst',
    groupBy: 'ip',
    severity: 'high',
    threshold: 10,
    windowMinutes: 15,
  },
]

const LOCAL_ALERT_HASH_SECRET = 'local-security-alert-secret'

export function evaluateSecurityAuditAlerts(
  events: readonly SecurityAuditEventForAlerting[],
  now = new Date(),
): SecurityAlert[] {
  return ALERT_RULES.flatMap((rule) => evaluateRule(events, rule, now))
}

function evaluateRule(
  events: readonly SecurityAuditEventForAlerting[],
  rule: SecurityAlertRule,
  now: Date,
) {
  const windowStart = now.getTime() - rule.windowMinutes * 60_000
  const counts = events.reduce<Map<string, number>>((groups, event) => {
    if (event.action !== rule.action) {
      return groups
    }

    const occurredAt = Date.parse(event.occurred_at)
    if (!Number.isFinite(occurredAt) || occurredAt < windowStart) {
      return groups
    }

    const group = getAlertGroup(event, rule)
    if (!group) {
      return groups
    }

    groups.set(group, (groups.get(group) ?? 0) + 1)
    return groups
  }, new Map())

  return Array.from(counts.entries())
    .filter(([, observed]) => observed >= rule.threshold)
    .map(([group, observed]) => ({
      code: rule.code,
      group,
      observed,
      severity: rule.severity,
      threshold: rule.threshold,
      windowMinutes: rule.windowMinutes,
    }))
}

function getAlertGroup(event: SecurityAuditEventForAlerting, rule: SecurityAlertRule) {
  if (rule.groupBy === 'global') {
    return 'global'
  }

  const value = event[rule.groupBy]
  return value ? `${rule.groupBy}:${fingerprintAlertSubject(value)}` : null
}

function fingerprintAlertSubject(value: string) {
  return createHmac('sha256', getAlertHashSecret())
    .update(value)
    .digest('hex')
    .slice(0, 24)
}

function getAlertHashSecret() {
  const secret =
    process.env.SECURITY_ALERT_HASH_SECRET ||
    process.env.PRIVACY_TOMBSTONE_SECRET ||
    process.env.USER_JWT_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY_ALERT_HASH_SECRET is required in production')
  }

  return LOCAL_ALERT_HASH_SECRET
}
