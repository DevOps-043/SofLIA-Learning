import type { CalendarChange } from './useStudyPlannerDashboardLIA';

export function formatCalendarChangesMessage(changes: CalendarChange[]): string {
  const deletedEvents = changes.filter((change) => change.type === 'deleted_event');
  const modifiedEvents = changes.filter((change) => change.type === 'modified_event');
  const conflicts = changes.filter((change) => change.type === 'conflict');

  let message = '**He detectado cambios importantes en tu calendario:**\n\n';

  if (deletedEvents.length > 0) {
    message += '**Sesiones eliminadas del calendario:**\n';
    deletedEvents.forEach((change) => {
      message += `- "${change.sessionTitle}" (${change.eventTime})\n`;
    });
    message += '\n';
    message += 'Estas sesiones ya no aparecen en tu calendario pero siguen en tu plan. ¿Quieres que las elimine del plan también?\n\n';
  }

  if (modifiedEvents.length > 0) {
    message += '**Sesiones modificadas en el calendario:**\n';
    modifiedEvents.forEach((change) => {
      message += `- "${change.sessionTitle}" - ${change.suggestedAction || 'Hora cambiada'}\n`;
    });
    message += '\n';
    message += '¿Quieres que actualice los horarios en tu plan para que coincidan?\n\n';
  }

  if (conflicts.length > 0) {
    message += '**Conflictos encontrados:**\n';
    conflicts.forEach((change) => {
      message += `- ${change.eventTitle} (${change.eventTime}) - ${change.suggestedAction}\n`;
    });
    message += '\n';
  }

  if (deletedEvents.length === 0 && modifiedEvents.length === 0 && conflicts.length === 0) {
    message = 'Todo está sincronizado. No he detectado cambios en tu calendario.';
  } else {
    message += 'Dime cómo quieres proceder y te ayudo a actualizar tu plan.';
  }

  return message;
}
