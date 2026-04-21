import type { StudyApproach, StudyPlannerPendingLesson } from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerComputedLessonDistribution,
} from '../types/planner-schedule.types';
import type { StudyPlannerUserContextApiData } from './planner-user-context-client.service';
import {
  buildStudyPlannerLessonDistribution,
  groupDistributionsByDay,
  type StudyPlannerLessonDistributionResult,
} from './planner-lesson-distribution.service';

export type { StudyPlannerLessonDistributionResult };
export { buildStudyPlannerLessonDistribution };

interface StudyPlannerProfileAvailability {
  minutesPerDay: number;
  recommendedBreak: number;
  recommendedSessionLength: number;
}

function formatSessionLength(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minutos`;
}

function buildProfileDescription(userProfile: StudyPlannerUserContextApiData | null): string | null {
  if (!userProfile) return null;
  const parts: string[] = [];
  if (userProfile.userType === 'b2b' && userProfile.organization?.name) {
    parts.push(`trabajas en ${userProfile.organization.name}`);
  } else {
    parts.push('eres profesional independiente');
  }
  const role = userProfile.professionalProfile?.rol?.nombre;
  const area = userProfile.professionalProfile?.area?.nombre;
  if (role) parts.push(`como ${role}`);
  if (area) parts.push(`en el area de ${area}`);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function buildStudyPlannerNoEventsMessage(userProfile: StudyPlannerUserContextApiData | null): string {
  const profileDescription = buildProfileDescription(userProfile);
  return [
    profileDescription ? `He analizado tu perfil. Veo que ${profileDescription}.` : 'He analizado tu perfil.',
    '\n',
    'No encontre eventos programados en tu calendario para el proximo mes. Esto nos da total flexibilidad para disenar tu plan de estudios.',
    '\n',
    '¿Que dias de la semana prefieres estudiar? ¿Y en que horario te concentras mejor: manana, tarde o noche?',
  ].join(' ');
}

export function buildStudyPlannerCalendarRecommendationMessage({
  busiestDays,
  calendarEventsCount,
  distributionResult,
  effectiveApproach,
  effectiveTargetDate,
  finalSlots,
  profileAvailability,
  provider,
  userProfile,
}: {
  busiestDays: string[];
  calendarEventsCount: number;
  distributionResult: StudyPlannerLessonDistributionResult;
  effectiveApproach: StudyApproach | null;
  effectiveTargetDate: string | null;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  profileAvailability: StudyPlannerProfileAvailability | null | undefined;
  provider: string;
  userProfile: StudyPlannerUserContextApiData | null;
}): string {
  if (calendarEventsCount === 0) return buildStudyPlannerNoEventsMessage(userProfile);

  const profileDescription = buildProfileDescription(userProfile);
  const introParts = [
    `¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} esta conectado.`,
    'He analizado tu perfil profesional y tu calendario.',
  ];
  if (profileDescription) introParts.push(`Veo que ${profileDescription}.`);
  introParts.push('\nHe encontrado multiples eventos en tu calendario durante el proximo mes.');
  if (busiestDays.length > 0) introParts.push(`Tus dias mas ocupados son: ${busiestDays.join(', ')}.`);

  let message = `${introParts.join(' ')}\n\n`;
  if (finalSlots.length === 0) return message.trim();

  const recommendationParts = ['**MIS RECOMENDACIONES:**', '\n'];

  if (profileAvailability) {
    const approachText =
      effectiveApproach === 'corto' ? 'terminar rapido'
      : effectiveApproach === 'balance' ? 'ritmo equilibrado'
      : effectiveApproach === 'largo' ? 'tomarte tu tiempo'
      : 'sesiones';
    const targetDateText = effectiveTargetDate ? ` y tu objetivo de completar los cursos para ${effectiveTargetDate}` : '';
    const rolText = userProfile?.professionalProfile?.rol?.nombre ? ` como ${userProfile.professionalProfile.rol.nombre}` : '';
    const nivelText = userProfile?.professionalProfile?.nivel?.nombre ? ` (${userProfile.professionalProfile.nivel.nombre})` : '';
    const hoursPerDay = Math.round((profileAvailability.minutesPerDay / 60) * 10) / 10;

    recommendationParts.push(
      `En base a tu perfil${rolText}${nivelText} y tu preferencia por **${approachText}**${targetDateText}, estimo que puedes dedicar aproximadamente ${hoursPerDay} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al dia para estudiar.`,
    );
    if (effectiveTargetDate) {
      recommendationParts.push(`He distribuido las sesiones de estudio hasta ${effectiveTargetDate} para asegurar que completes tus cursos a tiempo.`);
    }
    recommendationParts.push(
      `Te propongo estos horarios especificos para sesiones de ${formatSessionLength(profileAvailability.recommendedSessionLength)}${profileAvailability.recommendedBreak > 0 ? ` con descansos de ${profileAvailability.recommendedBreak} minutos` : ''}:`,
    );
  } else {
    recommendationParts.push('Basandome en los espacios libres que encontre en tu calendario, te sugiero estas sesiones de estudio:');
  }

  message += `${recommendationParts.join(' ')}\n`;

  const distributionsByDay = groupDistributionsByDay(distributionResult.computedDistribution);
  const sortedDays = Array.from(distributionsByDay.keys()).sort((l, r) => l.localeCompare(r));

  sortedDays.forEach((dateStr) => {
    const dayDistributions = distributionsByDay.get(dateStr);
    if (!dayDistributions || dayDistributions.length === 0) return;

    dayDistributions.sort((l, r) => l.slot.start.getTime() - r.slot.start.getTime());
    const displayDate = new Date(`${dateStr}T00:00:00`);
    const formattedDate = displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

    message += `\n${dayDistributions[0].slot.dayName} ${formattedDate}:\n`;
    dayDistributions.forEach((distribution) => {
      const totalMinutes = distribution.lessons.reduce((sum, l) => sum + (l.durationMinutes || 15), 0);
      const adjustedEnd = new Date(distribution.slot.start.getTime() + totalMinutes * 60000);
      const startTime = distribution.slot.start.toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false, minute: '2-digit' });
      const endTime = adjustedEnd.toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false, minute: '2-digit' });
      message += `   HORARIO EXACTO: ${startTime} - ${endTime} (${totalMinutes} min):\n`;
      distribution.lessons.forEach((lesson) => {
        message += `   - ${lesson.lessonTitle} (${lesson.durationMinutes || 15} min)\n`;
      });
      message += '\n';
    });
  });

  if (distributionResult.slotsAfterTarget > 0 && effectiveTargetDate) {
    message += `\n**Nota:** He identificado ${distributionResult.slotsAfterTarget} espacios adicionales disponibles despues de tu fecha objetivo (${effectiveTargetDate}). Estos pueden ser utiles para repaso o actividades complementarias.`;
  }

  return message.trim();
}

export function buildStudyPlannerAudioSummary({
  calendarEventsCount,
  daysWithFreeTime,
  finalSlots,
}: {
  calendarEventsCount: number;
  daysWithFreeTime: Array<{ dayName: string }>;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
}): string {
  if (calendarEventsCount === 0) {
    return 'Calendario conectado. No encontre eventos en el proximo mes. ¿Que dias y horarios prefieres para estudiar?';
  }
  if (finalSlots.length > 0) {
    const firstSlot = finalSlots[0];
    const timeStr = firstSlot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar el ${firstSlot.dayName} a las ${timeStr}. ¿Te parece bien?`;
  }
  if (daysWithFreeTime.length > 0) {
    const days = daysWithFreeTime.slice(0, 2).map((d) => d.dayName).join(' y ');
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar los ${days}. ¿Te parece bien?`;
  }
  return 'Analice tu calendario del proximo mes. Tu agenda esta muy ocupada, pero podemos encontrar espacios para estudiar. ¿Te parece bien?';
}
