import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CalendarEvent } from '../study-planner-calendar.types';

const serviceMocks = vi.hoisted(() => ({
  deleteStudyPlannerCalendarEventMock: vi.fn(),
  loadStudyPlannerCalendarEventsMock: vi.fn(),
  saveStudyPlannerCalendarEventMock: vi.fn(),
}));

vi.mock('../study-planner-calendar.service', () => ({
  deleteStudyPlannerCalendarEvent:
    serviceMocks.deleteStudyPlannerCalendarEventMock,
  loadStudyPlannerCalendarEvents:
    serviceMocks.loadStudyPlannerCalendarEventsMock,
  saveStudyPlannerCalendarEvent:
    serviceMocks.saveStudyPlannerCalendarEventMock,
}));

import { useStudyPlannerCalendarLogic } from '../useStudyPlannerCalendarLogic';

function createCalendarEvent(
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Planning session',
    start: '2026-04-02T09:00:00.000Z',
    end: '2026-04-02T10:00:00.000Z',
    provider: 'local',
    source: 'calendar',
    ...overrides,
  };
}

async function waitForInitialLoad() {
  await vi.waitFor(() => {
    expect(serviceMocks.loadStudyPlannerCalendarEventsMock).toHaveBeenCalled();
  });
}

describe('useStudyPlannerCalendarLogic behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.loadStudyPlannerCalendarEventsMock.mockResolvedValue([]);
    serviceMocks.deleteStudyPlannerCalendarEventMock.mockResolvedValue({
      success: true,
    });
    serviceMocks.saveStudyPlannerCalendarEventMock.mockResolvedValue({
      success: true,
    });
  });

  it('navigates to the next week without losing hook state', async () => {
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false }),
    );

    await waitForInitialLoad();

    const initialDate = result.current.currentDate.clone();

    act(() => {
      result.current.setView('week');
      result.current.goToNextWeek();
    });

    expect(result.current.view).toBe('week');
    expect(result.current.currentDate.diff(initialDate, 'days')).toBe(7);
  });

  it('navigates to the previous week without crashing', async () => {
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false }),
    );

    await waitForInitialLoad();

    const initialDate = result.current.currentDate.clone();

    act(() => {
      result.current.setView('week');
      result.current.goToPreviousWeek();
    });

    expect(result.current.view).toBe('week');
    expect(result.current.currentDate.diff(initialDate, 'days')).toBe(-7);
  });

  it('loads the selected event into the edit form', async () => {
    const event = createCalendarEvent({
      description: 'Existing description',
      location: 'Sala 1',
      color: 'var(--color-accent)',
    });
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false }),
    );

    await waitForInitialLoad();

    act(() => {
      result.current.setSelectedEvent(event);
    });

    act(() => {
      result.current.handleEditEvent();
    });

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.eventForm).toMatchObject({
      title: 'Planning session',
      description: 'Existing description',
      location: 'Sala 1',
      color: 'var(--color-accent)',
      start: '2026-04-02T09:00:00.000Z',
      end: '2026-04-02T10:00:00.000Z',
    });
  });

  it('opens a confirmation dialog and deletes the selected event', async () => {
    const event = createCalendarEvent({ localEventId: 'local-1' });
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false }),
    );

    await waitForInitialLoad();

    act(() => {
      result.current.setSelectedEvent(event);
      result.current.setIsEventModalOpen(true);
    });

    act(() => {
      result.current.handleDeleteEvent();
    });

    expect(result.current.confirmDialog.isOpen).toBe(true);

    await act(async () => {
      await result.current.confirmDialog.onConfirm();
    });

    expect(
      serviceMocks.deleteStudyPlannerCalendarEventMock,
    ).toHaveBeenCalledWith({ event });
    expect(result.current.selectedEvent).toBeNull();
    expect(result.current.isEventModalOpen).toBe(false);
    expect(result.current.toast).toMatchObject({
      isOpen: true,
      message: 'Evento eliminado exitosamente',
      type: 'success',
    });
  });

  it('keeps the modal open and shows an error toast when save fails', async () => {
    serviceMocks.saveStudyPlannerCalendarEventMock.mockResolvedValue({
      success: false,
      errorMessage: 'Permisos insuficientes',
    });
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: false }),
    );

    await waitForInitialLoad();

    act(() => {
      result.current.handleCreateEvent();
      result.current.setEventForm({
        ...result.current.eventForm,
        title: 'Nuevo evento',
        start: '2026-04-02T12:00:00.000Z',
        end: '2026-04-02T13:00:00.000Z',
      });
    });

    await act(async () => {
      await result.current.handleSaveEvent();
    });

    expect(serviceMocks.saveStudyPlannerCalendarEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventForm: expect.objectContaining({
          title: 'Nuevo evento',
        }),
        isCreatingEvent: true,
        selectedEvent: null,
      }),
    );
    expect(result.current.isEventModalOpen).toBe(true);
    expect(result.current.toast).toMatchObject({
      isOpen: true,
      message: 'Permisos insuficientes',
      type: 'error',
    });
  });

  it('clears state when the calendar load fails', async () => {
    serviceMocks.loadStudyPlannerCalendarEventsMock.mockRejectedValueOnce(
      new Error('calendar unavailable'),
    );
    const { result } = renderHook(() =>
      useStudyPlannerCalendarLogic({ showOnlyPlanEvents: true }),
    );

    await vi.waitFor(() => {
      expect(result.current.isLoadingEvents).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isRefreshing).toBe(false);
  });
});
