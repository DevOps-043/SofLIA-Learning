import type {
  CalendarEvent,
  StudyPlannerCalendarEventForm,
} from './study-planner-calendar.types';
import { normalizeCalendarMutationError } from './study-planner-calendar.utils';
import type { MutationApiPayload } from './study-planner-calendar-api.types';

export { loadStudyPlannerCalendarEvents } from './study-planner-calendar-load.service';

async function readJsonSafely<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export async function deleteStudyPlannerCalendarEvent(params: {
  event: CalendarEvent;
  fetcher?: typeof fetch;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const eventId = params.event.localEventId || params.event.id;
  const fetcher = params.fetcher || fetch;

  const response = await fetcher(`/api/study-planner/events/${eventId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    return { success: true };
  }

  const payload = await readJsonSafely<MutationApiPayload>(response);
  return {
    success: false,
    errorMessage: normalizeCalendarMutationError(
      payload.error || 'Error al eliminar el evento',
    ),
  };
}

export async function saveStudyPlannerCalendarEvent(params: {
  eventForm: StudyPlannerCalendarEventForm;
  fetcher?: typeof fetch;
  isCreatingEvent: boolean;
  selectedEvent: CalendarEvent | null;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const fetcher = params.fetcher || fetch;
  const endpoint = params.isCreatingEvent
    ? '/api/study-planner/events'
    : `/api/study-planner/events/${params.selectedEvent?.localEventId || params.selectedEvent?.id}`;
  const method = params.isCreatingEvent ? 'POST' : 'PUT';

  const response = await fetcher(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.eventForm),
  });

  if (response.ok) {
    return { success: true };
  }

  const payload = await readJsonSafely<MutationApiPayload>(response);
  return {
    success: false,
    errorMessage: normalizeCalendarMutationError(payload.error),
  };
}
