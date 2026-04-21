import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildActionProposals,
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

vi.mock('../calendar.service', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('../actions/calendar-actions.service', () => ({
  executeCreateCalendarEvent: vi.fn(),
  executeDeleteCalendarEvent: vi.fn(),
  executeListCalendarEvents: vi.fn(),
  executeMoveCalendarEvent: vi.fn(),
}))

vi.mock('../actions/planning-actions-v2.service', () => ({
  executeCreateMicroSessionV2: vi.fn(),
  executeDeletePlan: vi.fn(),
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

  it('normalizes rebalance aliases and requires confirmation before execution', async () => {
    const result = await resolveDashboardChatAction('user-1', 'plan-1', [
      {
        type: 'rebalanzar',
        status: 'pending',
        data: {},
      },
    ], null)

    expect(executeRebalancePlanV2).not.toHaveBeenCalled()
    expect(result?.type).toBe('rebalance_plan')
    expect(result?.status).toBe('confirmation_needed')
  })

  it('requires confirmation before update_session actions execute', async () => {
    const result = await resolveDashboardChatAction(
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

    expect(executeUpdateSessionV2).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        type: 'update_session',
        status: 'confirmation_needed',
      }),
    )
  })

  it('returns an error action when action json is invalid', () => {
    const result = extractActionTags(
      'Texto <action>{"type":"move_session","data":</action>',
    )

    expect(result.action?.status).toBe('error')
    expect(result.action?.code).toBe('invalid_action_json')
  })

  it('builds confirmation proposals for mutative actions', () => {
    const proposals = buildActionProposals([
      {
        type: 'move_session',
        status: 'confirmation_needed',
        data: {
          sessionId: 'session-1',
          newStartTime: '2026-04-21T10:00:00-06:00',
          newEndTime: '2026-04-21T11:00:00-06:00',
        },
      },
    ], 'trace-1')

    expect(proposals).toEqual([
      expect.objectContaining({
        type: 'move_session',
        status: 'confirmation_needed',
        requiresConfirmation: true,
        traceId: 'trace-1',
      }),
    ])
  })
})
