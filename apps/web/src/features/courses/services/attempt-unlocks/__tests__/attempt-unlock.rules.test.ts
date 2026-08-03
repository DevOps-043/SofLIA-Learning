import { describe, expect, it } from 'vitest'

import {
  attemptCountsAfterUnlock,
  resolveCountingWindowStart,
  resolveLatestUnlock,
  unlockAppliesToTarget,
} from '../attempt-unlock.rules'
import type { AttemptUnlockRecord, AttemptUnlockTarget } from '../attempt-unlock.types'

function unlock(overrides: Partial<AttemptUnlockRecord> = {}): AttemptUnlockRecord {
  return {
    unlockId: 'unlock-1',
    scope: 'quiz',
    lessonId: null,
    materialId: null,
    activityId: null,
    enrollmentId: null,
    effectiveFromUtc: '2026-08-01T10:00:00.000Z',
    grantedBy: 'admin-1',
    reason: null,
    createdAtUtc: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

const quizTarget: AttemptUnlockTarget = {
  userId: 'user-1',
  scope: 'quiz',
  lessonId: 'lesson-1',
  materialId: 'material-1',
  activityId: null,
  enrollmentId: 'enroll-1',
}

describe('unlockAppliesToTarget', () => {
  it('treats null references in the grant as wildcards', () => {
    expect(unlockAppliesToTarget(unlock({ lessonId: 'lesson-1' }), quizTarget)).toBe(true)
  })

  it('rejects a grant issued for a different lesson', () => {
    expect(unlockAppliesToTarget(unlock({ lessonId: 'other-lesson' }), quizTarget)).toBe(false)
  })

  it('rejects a grant issued for a different scope', () => {
    expect(unlockAppliesToTarget(unlock({ scope: 'dialogue' }), quizTarget)).toBe(false)
  })

  it('rejects a grant scoped to an enrollment the target does not have', () => {
    expect(
      unlockAppliesToTarget(unlock({ enrollmentId: 'enroll-2' }), quizTarget),
    ).toBe(false)
  })
})

describe('resolveLatestUnlock', () => {
  it('returns the most recent applicable grant', () => {
    const latest = resolveLatestUnlock(
      [
        unlock({ unlockId: 'old', effectiveFromUtc: '2026-07-01T10:00:00.000Z' }),
        unlock({ unlockId: 'new', effectiveFromUtc: '2026-08-01T10:00:00.000Z' }),
        unlock({ unlockId: 'other-lesson', lessonId: 'x', effectiveFromUtc: '2026-08-02T10:00:00.000Z' }),
      ],
      quizTarget,
    )
    expect(latest?.unlockId).toBe('new')
  })

  it('returns null when no grant applies', () => {
    expect(resolveLatestUnlock([unlock({ scope: 'dialogue' })], quizTarget)).toBeNull()
  })

  it('ignores grants with an unparseable timestamp', () => {
    expect(resolveLatestUnlock([unlock({ effectiveFromUtc: 'not-a-date' })], quizTarget)).toBeNull()
  })
})

describe('resolveCountingWindowStart', () => {
  const cooldownStart = '2026-08-01T00:00:00.000Z'

  it('keeps the cooldown start when there is no unlock', () => {
    expect(resolveCountingWindowStart(cooldownStart, null)).toBe(cooldownStart)
  })

  it('shortens the window when the unlock is newer', () => {
    expect(resolveCountingWindowStart(cooldownStart, '2026-08-01T06:00:00.000Z')).toBe(
      '2026-08-01T06:00:00.000Z',
    )
  })

  it('keeps the cooldown start when the unlock is older (already consumed)', () => {
    expect(resolveCountingWindowStart(cooldownStart, '2026-07-20T06:00:00.000Z')).toBe(cooldownStart)
  })
})

describe('attemptCountsAfterUnlock', () => {
  const unlockedFrom = '2026-08-01T10:00:00.000Z'

  it('counts every attempt when there is no unlock', () => {
    expect(attemptCountsAfterUnlock('2026-01-01T00:00:00.000Z', null)).toBe(true)
  })

  it('discards attempts made before the cut-off', () => {
    expect(attemptCountsAfterUnlock('2026-08-01T09:59:59.000Z', unlockedFrom)).toBe(false)
  })

  it('counts attempts made at or after the cut-off', () => {
    expect(attemptCountsAfterUnlock(unlockedFrom, unlockedFrom)).toBe(true)
    expect(attemptCountsAfterUnlock('2026-08-02T00:00:00.000Z', unlockedFrom)).toBe(true)
  })

  it('discards attempts with no timestamp once an unlock exists', () => {
    expect(attemptCountsAfterUnlock(null, unlockedFrom)).toBe(false)
  })
})
