import { describe, expect, it } from 'vitest';

import {
  buildDashboardAssistantMessage,
  resolveDashboardPrimaryAction,
} from './dashboard-soflia-chat-response.service';

describe('dashboard-soflia-chat-response.service', () => {
  it('falls back to the first proposal when the primary action is omitted', () => {
    const primaryAction = resolveDashboardPrimaryAction({
      actions: [
        {
          type: 'rebalance_plan',
          status: 'error',
          code: 'invalid_action_data',
          message: 'Accion invalida',
          data: {},
          traceId: 'trace-from-action',
        },
      ],
      response: 'Tengo una propuesta.',
      success: true,
    });

    expect(primaryAction).toEqual(
      expect.objectContaining({
        type: 'rebalance_plan',
        code: 'invalid_action_data',
      }),
    );
  });

  it('preserves action metadata needed by the dashboard UI', () => {
    const message = buildDashboardAssistantMessage({
      idPrefix: 'proactive',
      payload: {
        actions: [
          {
            type: 'rebalance_plan',
            status: 'error',
            code: 'invalid_action_data',
            message: 'Accion invalida',
            data: {},
            traceId: 'trace-from-action',
          },
        ],
        response: 'Tengo una propuesta.',
        success: true,
        traceId: 'trace-from-response',
      },
    });

    expect(message.actionType).toBe('rebalance_plan');
    expect(message.actionCode).toBe('invalid_action_data');
    expect(message.actionMessage).toBe('Accion invalida');
    expect(message.traceId).toBe('trace-from-response');
  });
});
