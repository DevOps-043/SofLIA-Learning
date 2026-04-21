import type { CalendarEvent } from '../../types/user-context.types';
import type { ValidationResult } from '../validation.service';

export function validateCalendarConflicts(
  sessions: Array<{ startTime: string; endTime: string; title?: string }>,
  calendarEvents: CalendarEvent[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const session of sessions) {
    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date(session.endTime);

    for (const event of calendarEvents) {
      if (event.status === 'cancelled') continue;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      if (sessionStart < eventEnd && sessionEnd > eventStart) {
        const sessionTitle = session.title || 'Sesión de estudio';
        if (event.status === 'confirmed') {
          errors.push(`"${sessionTitle}" se solapa con "${event.title}" (${eventStart.toLocaleString()}).`);
        } else {
          warnings.push(`"${sessionTitle}" podría solaparse con "${event.title}" (evento tentativo).`);
        }
      }
    }
  }

  if (errors.length > 0) {
    suggestions.push('Ajusta los horarios de las sesiones para evitar conflictos con tus eventos existentes.');
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}
