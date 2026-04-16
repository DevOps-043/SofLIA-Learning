import { describe, expect, it } from 'vitest'
import { parseStudyPlanApplyPatchRequest } from '../study-plan-apply-patch.utils'

describe('study-plan-apply-patch.utils', () => {
  it('parses move_session and move_day operations', () => {
    expect(
      parseStudyPlanApplyPatchRequest({
        planId: 'plan-1',
        operations: [
          {
            type: 'move_session',
            sessionId: 'session-1',
            targetDate: '2026-04-12',
            targetStartTime: '18:00',
            targetEndTime: '19:00',
          },
          {
            type: 'move_day',
            sourceDate: '2026-04-12',
            targetDate: '2026-04-13',
          },
        ],
      }),
    ).toEqual({
      planId: 'plan-1',
      operations: [
        {
          type: 'move_session',
          sessionId: 'session-1',
          clientReferenceId: undefined,
          targetDate: '2026-04-12',
          targetStartTime: '18:00',
          targetEndTime: '19:00',
        },
        {
          type: 'move_day',
          sourceDate: '2026-04-12',
          targetDate: '2026-04-13',
          sessionIds: undefined,
          clientReferenceIds: undefined,
        },
      ],
    })
  })

  it('rejects unsupported operations', () => {
    expect(() =>
      parseStudyPlanApplyPatchRequest({
        planId: 'plan-1',
        operations: [{ type: 'replan_everything' }],
      }),
    ).toThrow('Operacion no soportada: replan_everything')
  })
})
