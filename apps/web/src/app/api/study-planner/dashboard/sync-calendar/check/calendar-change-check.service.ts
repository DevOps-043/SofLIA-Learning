import 'server-only'
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service';
import type { Database } from '../../../../../../lib/supabase/types';
import { logger } from '../../../../../../lib/utils/logger';

interface StudySessionRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface CalendarEventSnapshot {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
}

export interface CalendarChange {
  type: 'new_event' | 'modified_event' | 'deleted_event' | 'conflict';
  eventId?: string;
  eventTitle: string;
  eventTime: string;
  eventEndTime?: string;
  affectedSessions?: Array<{
    sessionId: string;
    sessionTitle: string;
    sessionTime: string;
  }>;
  suggestedAction?: string;
}

export interface CheckCalendarResponse {
  success: boolean;
  data?: {
    changes: CalendarChange[];
    lastCheck: string;
    calendarProvider?: string;
    hasConflicts: boolean;
  };
  error?: string;
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no esta configurada.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const emptyCalendarCheck = (calendarProvider?: string): CheckCalendarResponse => ({
  success: true,
  data: {
    changes: [],
    lastCheck: new Date().toISOString(),
    calendarProvider,
    hasConflicts: false,
  },
});

export async function checkCalendarChangesForUser(
  userId: string,
): Promise<CheckCalendarResponse> {
  const supabase = createAdminClient();
  const { data: calendarIntegration, error: integrationError } = await supabase
    .from('calendar_integrations')
    .select(SELECT_COLUMNS.calendar_integrations)
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (integrationError || !calendarIntegration) {
    return emptyCalendarCheck();
  }

  const { data: activePlan } = await supabase
    .from('study_plans')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!activePlan) {
    return emptyCalendarCheck(calendarIntegration.provider);
  }

  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const { data: studySessionsData } = await supabase
    .from('study_sessions')
    .select('id, title, start_time, end_time, status')
    .eq('plan_id', activePlan.id)
    .eq('status', 'planned')
    .gte('start_time', now.toISOString())
    .lte('start_time', twoWeeksLater.toISOString())
    .order('start_time', { ascending: true });

  const studySessions = (studySessionsData || []) as StudySessionRow[];
  if (studySessions.length === 0) {
    return emptyCalendarCheck(calendarIntegration.provider);
  }

  const calendarEvents = await getCalendarEvents(userId, now, twoWeeksLater);
  const changes = detectCalendarChanges({
    calendarEvents,
    studySessions,
    isNewEvent: !calendarIntegration.updated_at,
  });

  await supabase
    .from('calendar_integrations')
    .update({
      last_sync_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  const conflicts = changes.filter(change => change.type === 'conflict');

  return {
    success: true,
    data: {
      changes: conflicts,
      lastCheck: now.toISOString(),
      calendarProvider: calendarIntegration.provider,
      hasConflicts: conflicts.length > 0,
    },
  };
}

async function getCalendarEvents(
  userId: string,
  from: Date,
  to: Date,
): Promise<CalendarEventSnapshot[]> {
  try {
    const events = await CalendarIntegrationService.getCalendarEvents(userId, from, to);

    return (events || []).map(event => ({
      id: event.id,
      title: event.title || 'Sin titulo',
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      status: event.status || 'confirmed',
    }));
  } catch (error) {
    logger.warn('Error obteniendo eventos del calendario:', error);
    return [];
  }
}

function detectCalendarChanges({
  calendarEvents,
  studySessions,
  isNewEvent,
}: {
  calendarEvents: CalendarEventSnapshot[];
  studySessions: StudySessionRow[];
  isNewEvent: boolean;
}): CalendarChange[] {
  const changes: CalendarChange[] = [];

  for (const calendarEvent of calendarEvents) {
    const conflictingSessions = studySessions.filter(session =>
      hasTimeOverlap(calendarEvent, session),
    );

    if (conflictingSessions.length > 0) {
      changes.push({
        type: 'conflict',
        eventId: calendarEvent.id,
        eventTitle: calendarEvent.title,
        eventTime: formatDateTime(calendarEvent.start),
        eventEndTime: formatDateTime(calendarEvent.end),
        affectedSessions: conflictingSessions.map(session => ({
          sessionId: session.id,
          sessionTitle: session.title,
          sessionTime: formatDateTime(new Date(session.start_time)),
        })),
        suggestedAction: `Mover la sesion "${conflictingSessions[0].title}" a otro horario`,
      });
    } else if (isNewEvent) {
      changes.push({
        type: 'new_event',
        eventId: calendarEvent.id,
        eventTitle: calendarEvent.title,
        eventTime: formatDateTime(calendarEvent.start),
        eventEndTime: formatDateTime(calendarEvent.end),
      });
    }
  }

  return changes;
}

function hasTimeOverlap(
  calendarEvent: CalendarEventSnapshot,
  session: StudySessionRow,
): boolean {
  const sessionStart = new Date(session.start_time);
  const sessionEnd = new Date(session.end_time);

  return (
    (calendarEvent.start < sessionEnd && calendarEvent.end > sessionStart)
    || (sessionStart < calendarEvent.end && sessionEnd > calendarEvent.start)
  );
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
