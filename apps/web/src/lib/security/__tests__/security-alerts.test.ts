import { beforeEach, describe, expect, it } from 'vitest'
import {
  evaluateSecurityAuditAlerts,
  type SecurityAuditEventForAlerting,
} from '../security-alerts'

function event(
  overrides: Partial<SecurityAuditEventForAlerting>,
): SecurityAuditEventForAlerting {
  return {
    action: 'login-failure',
    actor_id: null,
    ip: '203.0.113.10',
    occurred_at: '2026-05-18T10:00:00.000Z',
    result: 'denied',
    ...overrides,
  }
}

describe('evaluateSecurityAuditAlerts', () => {
  beforeEach(() => {
    process.env.SECURITY_ALERT_HASH_SECRET = 'test-security-alert-secret'
  })

  it('raises a high alert for login bursts from the same IP', () => {
    const events = Array.from({ length: 10 }, () => event({}))

    const alerts = evaluateSecurityAuditAlerts(
      events,
      new Date('2026-05-18T10:00:30.000Z'),
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toEqual({
      code: 'login_failure_burst',
      group: expect.stringMatching(/^ip:[a-f0-9]{24}$/),
      observed: 10,
      severity: 'high',
      threshold: 10,
      windowMinutes: 1,
    })
  })

  it('ignores events outside the alert window', () => {
    const events = Array.from({ length: 10 }, () =>
      event({ occurred_at: '2026-05-18T09:58:00.000Z' }),
    )

    expect(
      evaluateSecurityAuditAlerts(events, new Date('2026-05-18T10:00:30.000Z')),
    ).toEqual([])
  })

  it('raises a critical alert for repeated SSRF probes', () => {
    const events = Array.from({ length: 3 }, () =>
      event({
        action: 'safe-fetch-blocked',
        ip: '198.51.100.8',
      }),
    )

    const alerts = evaluateSecurityAuditAlerts(
      events,
      new Date('2026-05-18T10:00:30.000Z'),
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toEqual({
      code: 'ssrf_probe_burst',
      group: expect.stringMatching(/^ip:[a-f0-9]{24}$/),
      observed: 3,
      severity: 'critical',
      threshold: 3,
      windowMinutes: 15,
    })
  })
})
