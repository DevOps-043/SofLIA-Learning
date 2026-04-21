import type { LIAContextState, PendingLesson } from './lia-context.types';

export function buildContextForPrompt(state: LIAContextState): string {
  const { userProfile, courses, allPendingLessons, totalPendingLessons, calendar, preferences } = state;

  let context = '';

  if (userProfile) {
    context += `## USUARIO\n`;
    context += `- Nombre: ${userProfile.userName || 'No especificado'}\n`;
    context += `- Tipo: ${userProfile.userType === 'b2b' ? 'B2B (organización)' : 'B2C (independiente)'}\n`;
    if (userProfile.rol) context += `- Rol: ${userProfile.rol}\n`;
    if (userProfile.organizationName) context += `- Organización: ${userProfile.organizationName}\n`;
    context += '\n';
  }

  context += `## CURSOS ASIGNADOS (${courses.length})\n`;
  for (const course of courses) {
    context += `\n### ${course.courseTitle}\n`;
    if (course.dueDate) {
      const daysRemaining = Math.ceil(
        (new Date(course.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      context += `  📅 Fecha límite: ${new Date(course.dueDate).toLocaleDateString('es-ES')} (${daysRemaining} días)\n`;
    }
    context += `  ✅ Completadas: ${course.completedLessons}/${course.totalLessons}\n`;
    context += `  📚 Pendientes: ${course.pendingCount}\n`;
  }

  context += `\n## LECCIONES PENDIENTES (${totalPendingLessons} total)\n`;
  context += `⚠️ IMPORTANTE: Usa SOLO estas lecciones con sus nombres y duraciones EXACTAS.\n`;
  context += `⛔ PROHIBIDO inventar lecciones que no estén en esta lista.\n\n`;

  for (const lesson of allPendingLessons) {
    context += `- ${lesson.lessonTitle} (${lesson.durationMinutes} min) - ${lesson.moduleTitle}\n`;
  }

  context += `\n## CALENDARIO\n`;
  if (calendar.isConnected) {
    context += `- Conectado: ${calendar.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}\n`;
  } else if (calendar.wasSkipped) {
    context += `- El usuario prefirió NO conectar su calendario\n`;
    context += `- ⚠️ NO volver a preguntar por el calendario\n`;
  } else {
    context += `- No conectado\n`;
  }

  if (preferences.approach || preferences.targetDate || preferences.preferredDays.length > 0) {
    context += `\n## PREFERENCIAS DE ESTUDIO\n`;
    if (preferences.approach) {
      const approachLabels: Record<string, string> = {
        corto: 'Terminar rápido (sesiones de 60-90 min)',
        balance: 'Ritmo equilibrado (sesiones de 45-60 min)',
        largo: 'Sin prisa (sesiones de 20-35 min)',
      };
      context += `- Enfoque: ${approachLabels[preferences.approach]}\n`;
    }
    if (preferences.targetDate) context += `- Fecha objetivo: ${preferences.targetDate}\n`;
    if (preferences.preferredDays.length > 0) context += `- Días preferidos: ${preferences.preferredDays.join(', ')}\n`;
    if (preferences.preferredTimes.length > 0) context += `- Horarios preferidos: ${preferences.preferredTimes.join(', ')}\n`;
  }

  return context;
}

export function buildLessonsListForPrompt(pendingLessons: PendingLesson[]): string {
  if (pendingLessons.length === 0) return 'No hay lecciones pendientes definidas aún.';
  return pendingLessons
    .map((l) => `- ${l.lessonTitle} (${l.durationMinutes} min) - ${l.moduleTitle}`)
    .join('\n');
}
