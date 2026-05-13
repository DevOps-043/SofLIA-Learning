import { describe, expect, it } from 'vitest'

import {
  MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
  resolveDialogueAttempt,
} from '../dialogue-session.service'

describe('resolveDialogueAttempt', () => {
  it('allows a first dialogue session as attempt 1', () => {
    expect(resolveDialogueAttempt(0)).toEqual({
      kind: 'can_create',
      attemptNumber: 1,
    })
  })

  it('allows the third dialogue session as the last available attempt', () => {
    expect(resolveDialogueAttempt(2)).toEqual({
      kind: 'can_create',
      attemptNumber: 3,
    })
  })

  it('blocks creating a fourth dialogue session', () => {
    expect(resolveDialogueAttempt(MAX_DIALOGUE_ACTIVITY_ATTEMPTS)).toEqual({
      kind: 'limit_reached',
    })
  })
})
