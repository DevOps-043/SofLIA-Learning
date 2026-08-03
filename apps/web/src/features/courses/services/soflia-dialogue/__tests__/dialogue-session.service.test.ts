import { describe, expect, it } from 'vitest'

import {
  MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
  resolveDialogueAttempt,
} from '../dialogue-session.service'
import { cooldownWindowStart, retryAvailableAt } from '../../attempt-cooldown'

const NOW = new Date('2026-08-03T12:00:00.000Z')
const WINDOW_START = cooldownWindowStart(NOW)

/** `n` sesiones terminales repartidas dentro de la ventana (11:01, 11:02, …). */
function terminalSessions(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `2026-08-03T11:${String(index + 1).padStart(2, '0')}:00.000Z`,
  )
}

describe('resolveDialogueAttempt', () => {
  it('allows a first dialogue session as attempt 1', () => {
    expect(resolveDialogueAttempt([], WINDOW_START)).toEqual({
      kind: 'can_create',
      attemptNumber: 1,
    })
  })

  it('allows the last available attempt before reaching the limit', () => {
    expect(
      resolveDialogueAttempt(terminalSessions(MAX_DIALOGUE_ACTIVITY_ATTEMPTS - 1), WINDOW_START),
    ).toEqual({
      kind: 'can_create',
      attemptNumber: MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
    })
  })

  it('blocks once the limit is consumed and says when attempts come back', () => {
    const sessions = terminalSessions(MAX_DIALOGUE_ACTIVITY_ATTEMPTS)

    expect(resolveDialogueAttempt(sessions, WINDOW_START)).toEqual({
      kind: 'limit_reached',
      // La sesión más antigua (11:01) libera cupo una hora después.
      retryAfter: retryAvailableAt(sessions[0]),
    })
  })

  it('does not consume quota with sessions older than the cooldown window', () => {
    const stale = ['2026-08-03T09:00:00.000Z', '2026-08-03T09:30:00.000Z']

    expect(resolveDialogueAttempt([...stale, '2026-08-03T11:40:00.000Z'], WINDOW_START)).toEqual({
      kind: 'can_create',
      attemptNumber: 2,
    })
  })

  it('keeps the product limit at 5 attempts per activity', () => {
    expect(MAX_DIALOGUE_ACTIVITY_ATTEMPTS).toBe(5)
  })
})
