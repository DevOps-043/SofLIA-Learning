import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appendCalendarRecommendationMessage,
  buildSkippedCalendarProfileInfo,
  fetchStudyPlannerCalendarEvents,
} from '../study-planner-calendar-actions.shared';
import type { StudyPlannerMessage } from '../../../types/planner-ui.types';

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createHistorySetter(initialHistory: StudyPlannerMessage[] = []) {
  let history = initialHistory;
  const setConversationHistory = vi.fn(
    (
      value:
        | StudyPlannerMessage[]
        | ((previousHistory: StudyPlannerMessage[]) => StudyPlannerMessage[]),
    ) => {
    history = typeof value === 'function' ? value(history) : value;
    },
  );

  return {
    getHistory: () => history,
    setConversationHistory,
  };
}

describe('study-planner-calendar-actions.shared', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('builds profile details for skipped calendar mode', () => {
    const profileInfo = buildSkippedCalendarProfileInfo({
      organization: { name: 'Acme' },
      professionalProfile: {
        area: { nombre: 'Producto' },
        nivel: { nombre: 'Senior' },
        rol: { nombre: 'PM' },
        tamanoEmpresa: {
          maxEmpleados: 500,
          minEmpleados: 100,
          nombre: 'Mediana',
        },
      },
      userType: 'b2b',
    });

    expect(profileInfo).toContain('Usuario B2B');
    expect(profileInfo).toContain('Rol: PM');
    expect(profileInfo).toContain('Area: Producto');
    expect(profileInfo).toContain('Tiempo disponible: ~');
    expect(profileInfo).toContain('Sesiones recomendadas:');
  });

  it('handles calendar reconnection responses and schedules the modal reopen', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createJsonResponse({ requiresReconnection: true }, 401),
    ) as typeof fetch;

    const { getHistory, setConversationHistory } = createHistorySetter();
    const setConnectedCalendar = vi.fn();
    const setShowCalendarModal = vi.fn();

    const result = await fetchStudyPlannerCalendarEvents({
      endDate: new Date('2026-04-10T23:59:59.999Z'),
      provider: 'google',
      setConnectedCalendar,
      setConversationHistory,
      setShowCalendarModal,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
    });

    expect(result).toEqual({
      events: [],
      shouldAbort: true,
    });
    expect(setConnectedCalendar).toHaveBeenCalledWith(null);

    vi.runAllTimers();

    expect(setShowCalendarModal).toHaveBeenCalledWith(true);
    expect(getHistory()).toEqual([
      expect.objectContaining({
        role: 'assistant',
        content: expect.stringContaining('Google'),
      }),
    ]);
  });

  it('avoids duplicating recommendation messages', () => {
    const { getHistory, setConversationHistory } = createHistorySetter();
    const message = 'MIS RECOMENDACIONES\n- Bloque 1';

    appendCalendarRecommendationMessage(message, setConversationHistory);
    appendCalendarRecommendationMessage(message, setConversationHistory);

    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0]).toMatchObject({
      role: 'assistant',
      content: message,
    });
  });
});
