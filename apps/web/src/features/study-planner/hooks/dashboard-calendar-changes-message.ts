import type { CalendarChange } from './useStudyPlannerDashboardLIA';

export function formatCalendarChangesMessage(changes: CalendarChange[]): string {
  const deletedEvents = changes.filter(c => c.type === 'deleted_event');
  const modifiedEvents = changes.filter(c => c.type === 'modified_event');
  const conflicts = changes.filter(c => c.type === 'conflict');

  let message = 'ðŸ”” **He detectado cambios importantes en tu calendario:**\n\n';

  if (deletedEvents.length > 0) {
    message += 'âŒ **Sesiones eliminadas del calendario:**\n';
    deletedEvents.forEach(c => {
      message += `â€¢ "${c.sessionTitle}" (${c.eventTime})\n`;
    });
    message += '\n';
    message += 'Estas sesiones ya no aparecen en tu calendario pero siguen en tu plan. Â¿Quieres que las elimine del plan tambiÃ©n?\n\n';
  }

  if (modifiedEvents.length > 0) {
    message += 'ðŸ”„ **Sesiones modificadas en el calendario:**\n';
    modifiedEvents.forEach(c => {
      message += `â€¢ "${c.sessionTitle}" - ${c.suggestedAction || 'Hora cambiada'}\n`;
    });
    message += '\n';
    message += 'Â¿Quieres que actualice los horarios en tu plan para que coincidan?\n\n';
  }

  if (conflicts.length > 0) {
    message += 'âš ï¸ **Conflictos encontrados:**\n';
    conflicts.forEach(c => {
      message += `â€¢ ${c.eventTitle} (${c.eventTime}) - ${c.suggestedAction}\n`;
    });
    message += '\n';
  }

  if (deletedEvents.length === 0 && modifiedEvents.length === 0 && conflicts.length === 0) {
    message = 'âœ… Todo estÃ¡ sincronizado. No he detectado cambios en tu calendario.';
  } else {
    message += 'Dime cÃ³mo quieres proceder y te ayudo a actualizar tu plan.';
  }

  return message;
}
