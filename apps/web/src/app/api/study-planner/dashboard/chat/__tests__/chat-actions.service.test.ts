import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  extractActionTags,
  resolveDashboardChatAction,
} from '../chat-actions.service'
import { executeRebalancePlanV2 } from '../actions/planning-actions-v2.service'
import { executeUpdateSessionV2 } from '../actions/session-actions-v2.service'

vi.mock('../actions/session-actions-v2.service', () => ({
  executeCreateSessionV2: vi.fn(),
  executeDeleteSessionV2: vi.fn(),
  executeMoveSessionV2: vi.fn(),
  executeResizeSessionV2: vi.fn(),
  executeUpdateSessionV2: vi.fn(),
}))

vi.mock('../actions/calendar-actions.service', () => ({
  executeCreateCalendarEvent: vi.fn(),
  executeDeleteCalendarEvent: vi.fn(),
  executeListCalendarEvents: vi.fn(),
  executeMoveCalendarEvent: vi.fn(),
}))

vi.mock('../actions/planning-actions-v2.service', () => ({
  executeCreateMicroSessionV2: vi.fn(),
  executeRebalancePlanV2: vi.fn(),
  executeRecoverMissedSessionV2: vi.fn(),
  executeReduceSessionLoadV2: vi.fn(),
  executeUpdateCalendarSelection: vi.fn(),
}))

describe('chat-actions.service', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('extracts multiple actions and removes tags from the response', () => {
    const result = extractActionTags(
      'Texto visible <action>{"type":"rebalance_plan","data":{}}</action> otro <action>{"type":"move_session","data":{"sessionId":"1"}}</action>',
    )

    expect(result.actions).toHaveLength(2)
    expect(result.action?.type).toBe('rebalance_plan')
    expect(result.cleanResponse).toBe('Texto visible  otro')
  })

  it('normalizes rebalance aliases during execution', async () => {
    vi.mocked(executeRebalancePlanV2).mockResolvedValue({
      type: 'rebalance_plan',
      status: 'success',
      data: {},
    })

    const result = await resolveDashboardChatAction('user-1', 'plan-1', [
      {
        type: 'rebalanzar',
        status: 'pending',
        data: {},
      },
    ], null)

    expect(executeRebalancePlanV2).toHaveBeenCalledWith(
      'user-1',
      'plan-1',
      expect.objectContaining({ type: 'rebalance_plan' }),
      undefined,
    )
    expect(result?.status).toBe('success')
  })

  it('passes the original user message to update_session actions', async () => {
    vi.mocked(executeUpdateSessionV2).mockResolvedValue({
      type: 'update_session',
      status: 'success',
      data: {},
    })

    await resolveDashboardChatAction(
      'user-1',
      'plan-1',
      [
        {
          type: 'update_session',
          status: 'pending',
          data: { sessionId: 'session-1', start_time: '2026-04-12T10:00:00-06:00' },
        },
      ],
      null,
      'muevela al domingo aunque sea mi descanso',
    )

    expect(executeUpdateSessionV2).toHaveBeenCalledWith(
      'user-1',
      'plan-1',
      expect.objectContaining({ type: 'update_session' }),
      'muevela al domingo aunque sea mi descanso',
    )
  })
})
