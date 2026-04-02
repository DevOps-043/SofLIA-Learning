import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDisconnectCalendarHandler,
  createSkipCalendarConnectionHandler,
} from '../study-planner-calendar-connection.service';
import type {
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../../../types/planner-ui.types';

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createStateSetter<T>(initialValue: T) {
  let currentValue = initialValue;
  const setter = vi.fn(
    (value: T | ((previousValue: T) => T)) => {
      currentValue = typeof value === 'function' ? value(currentValue) : value;
    },
  );

  return {
    getValue: () => currentValue,
    setter,
  };
}

describe('study-planner-calendar-connection.service', () => {
  const originalFetch = global.fetch;
  const originalAlert = globalThis.alert;

  afterEach(() => {
    global.fetch = originalFetch;
    globalThis.alert = originalAlert;
    vi.restoreAllMocks();
  });

  it('disconnects the selected calendar provider', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse({ success: true }),
    ) as typeof fetch;

    const history = createStateSetter<StudyPlannerMessage[]>([]);
    const handler = createDisconnectCalendarHandler({
      isAudioEnabled: true,
      setConnectedCalendar: vi.fn(),
      setConversationHistory: history.setter,
      setIsConnectingCalendar: vi.fn(),
      setShowCalendarModal: vi.fn(),
      speakText: vi.fn().mockResolvedValue(undefined),
    });

    await handler('google');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/study-planner/calendar/disconnect',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(history.getValue()).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: expect.stringContaining('Google'),
      }),
    ]);
  });

  it('skips calendar setup and falls back to profile guidance', async () => {
    const history = createStateSetter<StudyPlannerMessage[]>([]);
    const userContext = createStateSetter<StudyPlannerUserContext | null>(null);
    const speakText = vi.fn().mockResolvedValue(undefined);

    const handler = createSkipCalendarConnectionHandler(
      {
        isAudioEnabled: true,
        setCalendarSkipped: vi.fn(),
        setConversationHistory: history.setter,
        setIsProcessing: vi.fn(),
        setShowCalendarModal: vi.fn(),
        setUserContext: userContext.setter,
        speakText,
      },
      {
        fetchStudyPlannerUserContext: vi.fn().mockResolvedValue({
          assignedCourses: [],
          rawProfile: {
            professionalProfile: {
              rol: { nombre: 'PM' },
            },
            userType: 'b2c',
          },
          success: true,
          userContext: {
            area: null,
            maxEmpleados: null,
            minEmpleados: null,
            nivel: null,
            organizationName: null,
            rol: 'PM',
            tamanoEmpresa: null,
            userName: null,
            userType: 'b2c',
            workTeams: null,
          },
          userId: 'user-1',
        }),
      },
    );

    await handler();

    expect(history.getValue()).toHaveLength(2);
    expect(history.getValue()[0]).toMatchObject({
      role: 'user',
      content: 'Prefiero no conectar mi calendario por ahora',
    });
    expect(history.getValue()[1]).toMatchObject({
      role: 'assistant',
      content: expect.stringContaining('Que dias de la semana prefieres estudiar'),
    });
    expect(userContext.getValue()).toMatchObject({
      rol: 'PM',
      userType: 'b2c',
    });
    expect(speakText).toHaveBeenCalled();
  });
});
