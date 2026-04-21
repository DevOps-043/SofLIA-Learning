import type { OrganizationPlannerConfig } from '../organization-planner-config.service';
import type { ValidationResult } from '../validation.service';

export function validateAgainstOrgConfig(
  sessions: Array<{ date: Date; startHour: number; endHour: number }>,
  orgConfig: OrganizationPlannerConfig,
): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const workStartHour = parseInt(orgConfig.workStartTime.split(':')[0], 10);
  const workEndHour = parseInt(orgConfig.workEndTime.split(':')[0], 10);

  let outsideWorkHoursCount = 0;
  let nonWorkDayCount = 0;

  for (const session of sessions) {
    const dayOfWeek = session.date.getDay();
    if (!orgConfig.workDays.includes(dayOfWeek)) nonWorkDayCount++;
    if (session.startHour < workStartHour || session.endHour > workEndHour) outsideWorkHoursCount++;
  }

  if (outsideWorkHoursCount > 0) {
    warnings.push(
      `${outsideWorkHoursCount} sesion(es) estan fuera del horario laboral de tu organizacion (${orgConfig.workStartTime} - ${orgConfig.workEndTime}). Puedes estudiar cuando prefieras, pero dentro del horario laboral es lo recomendado.`,
    );
  }

  if (nonWorkDayCount > 0) {
    warnings.push(
      `${nonWorkDayCount} sesion(es) caen en dias fuera de la jornada laboral configurada. Puedes mantenerlas si lo deseas.`,
    );
  }

  if (outsideWorkHoursCount > 0 || nonWorkDayCount > 0) {
    suggestions.push(
      'Tu organizacion sugiere estudiar dentro del horario laboral. Considera mover las sesiones para mayor comodidad.',
    );
  }

  return { isValid: true, errors: [], warnings, suggestions };
}

export function validatePlanningWindow(
  sessionDates: Date[],
  planningWindow: { start?: Date | null; end?: Date | null },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!planningWindow.start && !planningWindow.end) {
    return { isValid: true, errors, warnings, suggestions };
  }

  let beforeWindowCount = 0;
  let afterWindowCount = 0;

  for (const sessionDate of sessionDates) {
    const dateOnly = new Date(sessionDate);
    dateOnly.setHours(0, 0, 0, 0);

    if (planningWindow.start) {
      const winStart = new Date(planningWindow.start);
      winStart.setHours(0, 0, 0, 0);
      if (dateOnly < winStart) beforeWindowCount++;
    }

    if (planningWindow.end) {
      const winEnd = new Date(planningWindow.end);
      winEnd.setHours(23, 59, 59, 999);
      if (dateOnly > winEnd) afterWindowCount++;
    }
  }

  if (beforeWindowCount > 0) {
    warnings.push(`${beforeWindowCount} sesion(es) estan programadas antes del inicio de la ventana de planificacion.`);
  }

  if (afterWindowCount > 0) {
    errors.push(`${afterWindowCount} sesion(es) estan programadas despues del cierre de la ventana de planificacion. Deben reprogramarse.`);
  }

  if (beforeWindowCount > 0 || afterWindowCount > 0) {
    suggestions.push(
      'Ajusta las fechas de tus sesiones para que caigan dentro de la ventana administrativa asignada por tu organizacion.',
    );
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}
