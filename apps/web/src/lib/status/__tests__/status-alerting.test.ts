import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/features/notifications/services/auto-notifications-system-create.service', () => ({
  createSystemNotification: vi.fn(),
}))
vi.mock('../get-platform-admins', () => ({
  getPlatformAdminIds: vi.fn(),
}))

import { ServiceStatus, StatusComponentKey } from '@aprende-y-aplica/shared'

import { buildStatusDedupKey } from '../status-alerting'

const FOUR_HOURS_MS = 4 * 3_600_000

describe('buildStatusDedupKey', () => {
  it('is stable across cron ticks within the same 4h bucket (no admin spam while still down)', () => {
    const now = Date.UTC(2026, 6, 1, 10, 0, 0)
    const fiveMinutesLater = now + 5 * 60_000

    const first = buildStatusDedupKey(StatusComponentKey.GEMINI_AI, ServiceStatus.DOWN, false, now)
    const second = buildStatusDedupKey(
      StatusComponentKey.GEMINI_AI,
      ServiceStatus.DOWN,
      false,
      fiveMinutesLater,
    )

    expect(second).toBe(first)
  })

  it('changes after the 4h bucket rolls over (periodic re-alert while still down)', () => {
    const now = Date.UTC(2026, 6, 1, 10, 0, 0)

    const first = buildStatusDedupKey(StatusComponentKey.GEMINI_AI, ServiceStatus.DOWN, false, now)
    const afterRollover = buildStatusDedupKey(
      StatusComponentKey.GEMINI_AI,
      ServiceStatus.DOWN,
      false,
      now + FOUR_HOURS_MS,
    )

    expect(afterRollover).not.toBe(first)
  })

  it('differs per component and per status', () => {
    const now = Date.UTC(2026, 6, 1, 10, 0, 0)

    const geminiDown = buildStatusDedupKey(StatusComponentKey.GEMINI_AI, ServiceStatus.DOWN, false, now)
    const dbDown = buildStatusDedupKey(StatusComponentKey.DATABASE, ServiceStatus.DOWN, false, now)
    const geminiDegraded = buildStatusDedupKey(
      StatusComponentKey.GEMINI_AI,
      ServiceStatus.DEGRADED,
      false,
      now,
    )

    expect(dbDown).not.toBe(geminiDown)
    expect(geminiDegraded).not.toBe(geminiDown)
  })

  it('uses a distinct recovery key scoped to the hour', () => {
    const now = Date.UTC(2026, 6, 1, 10, 15, 0)
    const sameHour = Date.UTC(2026, 6, 1, 10, 45, 0)

    const recovery = buildStatusDedupKey(
      StatusComponentKey.GEMINI_AI,
      ServiceStatus.OPERATIONAL,
      true,
      now,
    )
    const recoverySameHour = buildStatusDedupKey(
      StatusComponentKey.GEMINI_AI,
      ServiceStatus.OPERATIONAL,
      true,
      sameHour,
    )

    expect(recovery).toContain(':recovered:')
    expect(recoverySameHour).toBe(recovery)
  })
})
