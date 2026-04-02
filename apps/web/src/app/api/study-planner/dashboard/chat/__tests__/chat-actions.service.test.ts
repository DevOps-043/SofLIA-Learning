import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  extractActionTags,
  resolveDashboardChatAction,
} from '../chat-actions.service'
import { executeRebalancePlan } from '../actions/planning-actions.service'

vi.mock('../actions/session-actions.service', () => ({
  executeCreateSession: vi.fn(),
  executeDeleteSession: vi.fn(),
  executeMoveSession: vi.fn(),
  executeResizeSession: vi.fn(),
  executeUpdateSession: vi.fn(),
}))

vi.mock('../actions/calendar-actions.service', () => ({
  executeCreateCalendarEvent: vi.fn(),
  executeDeleteCalendarEvent: vi.fn(),
  executeListCalendarEvents: vi.fn(),
  executeMoveCalendarEvent: vi.fn(),
}))

vi.mock('../actions/planning-actions.service', () => ({
  executeCreateMicroSession: vi.fn(),
  executeRebalancePlan: vi.fn(),
  executeRecoverMissedSession: vi.fn(),
  executeReduceSessionLoad: vi.fn(),
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
    vi.mocked(executeRebalancePlan).mockResolvedValue({
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

    expect(executeRebalancePlan).toHaveBeenCalledWith(
      'user-1',
      'plan-1',
      expect.objectContaining({ type: 'rebalance_plan' }),
    )
    expect(result?.status).toBe('success')
  })
})
