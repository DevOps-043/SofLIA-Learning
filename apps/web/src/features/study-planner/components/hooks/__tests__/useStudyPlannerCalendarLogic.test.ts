import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStudyPlannerCalendarLogic } from '../useStudyPlannerCalendarLogic';

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('useStudyPlannerCalendarLogic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('loads events and applies the study-session filter', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          events: [
            {
              id: 'google-1',
              title: 'Meeting',
              start: '2026-04-02T09:00:00.000Z',
              end: '2026-04-02T10:00:00.000Z',
            },
          ],
          provider: 'google',
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          sessions: [
            {
              id: 'session-1',
              title: 'Sesion',
              start_time: '2026-04-02T11:00:00.000Z',
              end_time: '2026-04-02T12:00:00.000Z',
              external_event_id: 'google-1',
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          events: [
            {
              id: 'local-1',
              title: 'Custom',
              start_time: '2026-04-03T09:00:00.000Z',
              end_time: '2026-04-03T10:00:00.000Z',
            },
          ],
        })
      ) as typeof fetch;

    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: true })
    );

    await vi.waitFor(() => {
      expect(result.current.isLoadingEvents).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      id: 'session-1',
      source: 'study_session',
    });
  });

  it('opens the create-event flow with default form data', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ events: [], sessions: [] })) as typeof fetch;

    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false })
    );

    await vi.waitFor(() => {
      expect(result.current.isLoadingEvents).toBe(false);
    });

    act(() => {
      result.current.handleCreateEvent();
    });

    expect(result.current.isCreatingEvent).toBe(true);
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.isEventModalOpen).toBe(true);
    expect(result.current.eventForm.start).not.toBe('');
    expect(result.current.eventForm.end).not.toBe('');
  });
});
