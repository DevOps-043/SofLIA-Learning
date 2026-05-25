import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildLockoutErrorMessage,
  buildLoginAttemptContext,
  clearLoginLockout,
  clearMemoryLoginLockoutsForTests,
  getLoginLockoutStatus,
  recordFailedLoginAttempt,
} from '../lockout'

describe('login lockout', () => {
  beforeEach(() => {
    clearMemoryLoginLockoutsForTests()
  })

  it('locks the login identifier after five failed attempts in the window', async () => {
    const context = buildLoginAttemptContext(
      'Admin@Soflia.com',
      new Headers({ 'x-real-ip': '203.0.113.10' }),
    )

    for (let attempt = 1; attempt < 5; attempt++) {
      const status = await recordFailedLoginAttempt(context)
      expect(status.isLocked).toBe(false)
      expect(status.attemptsRemaining).toBe(5 - attempt)
    }

    const lockedStatus = await recordFailedLoginAttempt(context)

    expect(lockedStatus.isLocked).toBe(true)
    expect(lockedStatus.attemptsRemaining).toBe(0)
    expect(buildLockoutErrorMessage(lockedStatus)).toContain('Demasiados intentos fallidos')
  })

  it('clears the lockout state after a successful login', async () => {
    const context = buildLoginAttemptContext(
      'learner@soflia.com',
      new Headers({ 'x-real-ip': '203.0.113.11' }),
    )

    await recordFailedLoginAttempt(context)
    await clearLoginLockout(context)

    await expect(getLoginLockoutStatus(context)).resolves.toMatchObject({
      attemptsRemaining: 5,
      isLocked: false,
    })
  })
})
