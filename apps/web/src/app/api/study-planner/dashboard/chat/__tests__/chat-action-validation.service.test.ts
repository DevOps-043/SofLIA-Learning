import { describe, expect, it } from 'vitest'
import {
  defaultConfirmationMessage,
  normalizeActionType,
  parseActionTagContent,
} from '../chat-action-validation.service'

describe('chat-action-validation.service', () => {
  it('normalizes rebalance aliases', () => {
    expect(normalizeActionType('rebalanzar')).toBe('rebalance_plan')
    expect(normalizeActionType('redistribuir')).toBe('rebalance_plan')
  })

  it('marks mutative actions as confirmation needed after validation', () => {
    const result = parseActionTagContent(JSON.stringify({
      type: 'move_session',
      data: {
        sessionId: 'session-1',
        newStartTime: '2026-04-22T10:00:00-06:00',
        newEndTime: '2026-04-22T11:00:00-06:00',
      },
    }))

    expect(result).toEqual(
      expect.objectContaining({
        type: 'move_session',
        status: 'confirmation_needed',
        requiresConfirmation: true,
      }),
    )
  })

  it('returns a structured schema error for invalid action data', () => {
    const result = parseActionTagContent(JSON.stringify({
      type: 'move_session',
      data: {
        sessionId: 'session-1',
      },
    }))

    expect(result.status).toBe('error')
    expect(result.code).toBe('invalid_action_data')
  })

  it('allows rebalance actions without explicit moves so the server can calculate them', () => {
    const result = parseActionTagContent(JSON.stringify({
      type: 'rebalance_plan',
      data: {},
    }))

    expect(result.status).toBe('confirmation_needed')
    expect(result.requiresConfirmation).toBe(true)
  })

  it('builds human confirmation messages by action type', () => {
    const message = defaultConfirmationMessage({
      type: 'delete_plan',
      status: 'confirmation_needed',
      data: {},
    })

    expect(message).toContain('eliminar el plan completo')
  })
})
