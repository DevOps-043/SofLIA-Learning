import type {
  StudyApproach,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerComputedLessonDistribution,
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import type { StudyPlannerUserContextApiData } from './planner-user-context-client.service';
import { serializeLessonDistributionForStorage } from './lesson-distribution.service';

interface StudyPlannerProfileAvailability {
  minutesPerDay: number;
  recommendedBreak: number;
  recommendedSessionLength: number;
}

interface BuildStudyPlannerLessonDistributionInput {
  approach: StudyApproach | null;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  pendingLessons: StudyPlannerPendingLesson[];
  targetDateObj: Date | null;
}

interface BuildStudyPlannerCalendarRecommendationMessageInput {
  busiestDays: string[];
  calendarEventsCount: number;
  distributionResult: StudyPlannerLessonDistributionResult;
  effectiveApproach: StudyApproach | null;
  effectiveTargetDate: string | null;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  profileAvailability: StudyPlannerProfileAvailability | null | undefined;
  provider: string;
  userProfile: StudyPlannerUserContextApiData | null;
}

interface BuildStudyPlannerAudioSummaryInput {
  calendarEventsCount: number;
  daysWithFreeTime: Array<{ dayName: string }>;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
}

export interface StudyPlannerLessonDistributionResult {
  computedDistribution: StudyPlannerComputedLessonDistribution[];
  slotsAfterTarget: number;
  storedDistribution: StudyPlannerStoredLessonDistribution[];
  totalPendingLessons: number;
}

function getApproachMultiplier(approach: StudyApproach | null): number {
  if (approach === 'corto') {
    return 0.8;
  }

  if (approach === 'largo') {
    return 1.2;
  }

  return 1;
}

function formatSessionLength(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }

  return `${minutes} minutos`;
}

function groupDistributionsByDay(
  distributions: StudyPlannerComputedLessonDistribution[],
): Map<string, StudyPlannerComputedLessonDistribution[]> {
  return distributions.reduce((map, distribution) => {
    const currentItems = map.get(distribution.slot.dateStr) || [];
    currentItems.push(distribution);
    map.set(distribution.slot.dateStr, currentItems);
    return map;
  }, new Map<string, StudyPlannerComputedLessonDistribution[]>());
}

/**
 * Minimum accumulated duration (minutes) before we allow a module-boundary
 * break.  Below this threshold the session keeps accepting lessons from the
 * next module so the user actually gets the session length they requested.
 */
const MIN_SESSION_BEFORE_MODULE_BREAK = 45;

function assignLessonsToSlot(params: {
  approachMultiplier: number;
  assignedLessonIds: Set<string>;
  pendingLessons: StudyPlannerPendingLesson[];
  slotDuration: number;
  startIndex: number;
}): {
  lessons: StudyPlannerScheduledLesson[];
  nextIndex: number;
} {
  const lessonsForSlot: StudyPlannerScheduledLesson[] = [];
  let currentIndex = params.startIndex;
  let currentSlotCourseId: string | null = null;
  let currentSlotModuleIndex: number | null = null;
  let usedDurationInSlot = 0;

  while (currentIndex < params.pendingLessons.length) {
    const lesson = params.pendingLessons[currentIndex];

    if (!lesson.lessonTitle || params.assignedLessonIds.has(lesson.lessonId)) {
      currentIndex += 1;
      continue;
    }

    const finalDuration = Math.ceil((lesson.durationMinutes || 15) * params.approachMultiplier);
    const fits = usedDurationInSlot + finalDuration <= params.slotDuration;

    if (!fits) {
      break;
    }

    const isSlotEmpty = lessonsForSlot.length === 0;
    const isSameModule =
      isSlotEmpty ||
      (
        currentSlotModuleIndex !== null &&
        lesson.moduleOrderIndex === currentSlotModuleIndex &&
        lesson.courseId === currentSlotCourseId
      );

    // Only break on module change when the session already has enough content.
    // This prevents tiny 20-min sessions when the user asked for 60-90 min.
    if (!isSlotEmpty && !isSameModule && usedDurationInSlot >= MIN_SESSION_BEFORE_MODULE_BREAK) {
      break;
    }

    lessonsForSlot.push({
      courseTitle: lesson.courseTitle,
      durationMinutes: finalDuration,
      lessonOrderIndex: lesson.lessonOrderIndex,
      lessonTitle: lesson.lessonTitle,
      moduleOrderIndex: lesson.moduleOrderIndex,
      moduleTitle: lesson.moduleTitle,
    });

    params.assignedLessonIds.add(lesson.lessonId);
    usedDurationInSlot += finalDuration;
    currentSlotCourseId = lesson.courseId;
    currentSlotModuleIndex = lesson.moduleOrderIndex;
    currentIndex += 1;
  }

  return {
    lessons: lessonsForSlot,
    nextIndex: currentIndex,
  };
}

function buildDistributionPhase(params: {
  approachMultiplier: number;
  assignedLessonIds: Set<string>;
  currentLessonIndex: number;
  distributions: StudyPlannerComputedLessonDistribution[];
  pendingLessons: StudyPlannerPendingLesson[];
  usedSlotKeys: Set<string>;
  slots: StudyPlannerCalendarFreeSlotWithDay[];
}): number {
  let nextLessonIndex = params.currentLessonIndex;

  for (const slot of params.slots) {
    if (nextLessonIndex >= params.pendingLessons.length) {
      break;
    }

    const slotKey = `${slot.dateStr}_${slot.start.toISOString()}`;
    if (params.usedSlotKeys.has(slotKey)) {
      continue;
    }

    const assignment = assignLessonsToSlot({
      approachMultiplier: params.approachMultiplier,
      assignedLessonIds: params.assignedLessonIds,
      pendingLessons: params.pendingLessons,
      slotDuration: slot.durationMinutes,
      startIndex: nextLessonIndex,
    });

    nextLessonIndex = assignment.nextIndex;

    if (assignment.lessons.length === 0) {
      continue;
    }

    params.usedSlotKeys.add(slotKey);
    params.distributions.push({
      lessons: assignment.lessons,
      slot: {
        dateStr: slot.dateStr,
        dayName: slot.dayName,
        end: slot.end,
        start: slot.start,
      },
    });
  }

  return nextLessonIndex;
}

export function buildStudyPlannerLessonDistribution({
  approach,
  finalSlots,
  pendingLessons,
  targetDateObj,
}: BuildStudyPlannerLessonDistributionInput): StudyPlannerLessonDistributionResult {
  const approachMultiplier = getApproachMultiplier(approach);
  const sortedSlots = [...finalSlots].sort((left, right) => left.date.getTime() - right.date.getTime());
  const slotsUntilTarget = targetDateObj
    ? sortedSlots.filter((slot) => {
        const slotDateOnly = new Date(slot.date);
        slotDateOnly.setHours(0, 0, 0, 0);
        const targetDateOnly = new Date(targetDateObj);
        targetDateOnly.setHours(0, 0, 0, 0);
        return slotDateOnly.getTime() <= targetDateOnly.getTime();
      })
    : sortedSlots;

  const distributions: StudyPlannerComputedLessonDistribution[] = [];
  const usedSlotKeys = new Set<string>();
  const assignedLessonIds = new Set<string>();

  let currentLessonIndex = buildDistributionPhase({
    approachMultiplier,
    assignedLessonIds,
    currentLessonIndex: 0,
    distributions,
    pendingLessons,
    slots: slotsUntilTarget,
    usedSlotKeys,
  });

  if (currentLessonIndex < pendingLessons.length) {
    const unusedSlots = sortedSlots.filter((slot) => {
      const slotKey = `${slot.dateStr}_${slot.start.toISOString()}`;
      return !usedSlotKeys.has(slotKey);
    });

    currentLessonIndex = buildDistributionPhase({
      approachMultiplier,
      assignedLessonIds,
      currentLessonIndex,
      distributions,
      pendingLessons,
      slots: unusedSlots,
      usedSlotKeys,
    });
  }

  const slotsAfterTarget = targetDateObj
    ? sortedSlots.filter((slot) => {
        const slotDateOnly = new Date(slot.date);
        slotDateOnly.setHours(0, 0, 0, 0);
        const targetDateOnly = new Date(targetDateObj);
        targetDateOnly.setHours(0, 0, 0, 0);
        return slotDateOnly.getTime() > targetDateOnly.getTime();
      }).length
    : 0;

  return {
    computedDistribution: distributions,
    slotsAfterTarget,
    storedDistribution: serializeLessonDistributionForStorage(distributions),
    totalPendingLessons: pendingLessons.length,
  };
}

function buildProfileDescription(userProfile: StudyPlannerUserContextApiData | null): string | null {
  if (!userProfile) {
    return null;
  }

  const descriptionParts: string[] = [];
  if (userProfile.userType === 'b2b' && userProfile.organization?.name) {
    descriptionParts.push(`trabajas en ${userProfile.organization.name}`);
  } else {
    descriptionParts.push('eres profesional independiente');
  }

  const role = userProfile.professionalProfile?.rol?.nombre;
  const area = userProfile.professionalProfile?.area?.nombre;

  if (role) {
    descriptionParts.push(`como ${role}`);
  }

  if (area) {
    descriptionParts.push(`en el area de ${area}`);
  }

  return descriptionParts.length > 0 ? descriptionParts.join(' ') : null;
}

export function buildStudyPlannerNoEventsMessage(
  userProfile: StudyPlannerUserContextApiData | null,
): string {
  const profileDescription = buildProfileDescription(userProfile);
  const messageParts = [
    profileDescription
      ? `He analizado tu perfil. Veo que ${profileDescription}.`
      : 'He analizado tu perfil.',
    '\n',
    'No encontre eventos programados en tu calendario para el proximo mes. Esto nos da total flexibilidad para disenar tu plan de estudios.',
    '\n',
    '¿Que dias de la semana prefieres estudiar? ¿Y en que horario te concentras mejor: manana, tarde o noche?',
  ];

  return messageParts.join(' ');
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
}: BuildStudyPlannerCalendarRecommendationMessageInput): string {
  if (calendarEventsCount === 0) {
    return buildStudyPlannerNoEventsMessage(userProfile);
  }

  const profileDescription = buildProfileDescription(userProfile);
  const introParts = [
    `¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} esta conectado.`,
    'He analizado tu perfil profesional y tu calendario.',
  ];

  if (profileDescription) {
    introParts.push(`Veo que ${profileDescription}.`);
  }

  introParts.push('\nHe encontrado multiples eventos en tu calendario durante el proximo mes.');
  if (busiestDays.length > 0) {
    introParts.push(`Tus dias mas ocupados son: ${busiestDays.join(', ')}.`);
  }

  let message = `${introParts.join(' ')}\n\n`;

  if (finalSlots.length === 0) {
    return message.trim();
  }

  const recommendationParts = ['**MIS RECOMENDACIONES:**', '\n'];

  if (profileAvailability) {
    const approachText =
      effectiveApproach === 'corto'
        ? 'terminar rapido'
        : effectiveApproach === 'balance'
          ? 'ritmo equilibrado'
          : effectiveApproach === 'largo'
            ? 'tomarte tu tiempo'
            : 'sesiones';
    const targetDateText = effectiveTargetDate
      ? ` y tu objetivo de completar los cursos para ${effectiveTargetDate}`
      : '';

    recommendationParts.push(
      `En base a tu perfil${userProfile?.professionalProfile?.rol?.nombre ? ` como ${userProfile.professionalProfile.rol.nombre}` : ''}${userProfile?.professionalProfile?.nivel?.nombre ? ` (${userProfile.professionalProfile.nivel.nombre})` : ''} y tu preferencia por **${approachText}**${targetDateText}, estimo que puedes dedicar aproximadamente ${Math.round((profileAvailability.minutesPerDay / 60) * 10) / 10} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al dia para estudiar.`,
    );

    if (effectiveTargetDate) {
      recommendationParts.push(
        `He distribuido las sesiones de estudio hasta ${effectiveTargetDate} para asegurar que completes tus cursos a tiempo.`,
      );
    }

    recommendationParts.push(
      `Te propongo estos horarios especificos para sesiones de ${formatSessionLength(profileAvailability.recommendedSessionLength)}${profileAvailability.recommendedBreak > 0 ? ` con descansos de ${profileAvailability.recommendedBreak} minutos` : ''}:`,
    );
  } else {
    recommendationParts.push(
      'Basandome en los espacios libres que encontre en tu calendario, te sugiero estas sesiones de estudio:',
    );
  }

  message += `${recommendationParts.join(' ')}\n`;

  const distributionsByDay = groupDistributionsByDay(distributionResult.computedDistribution);
  const sortedDays = Array.from(distributionsByDay.keys()).sort((left, right) =>
    left.localeCompare(right),
  );

  sortedDays.forEach((dateStr) => {
    const dayDistributions = distributionsByDay.get(dateStr);
    if (!dayDistributions || dayDistributions.length === 0) {
      return;
    }

    dayDistributions.sort((left, right) => left.slot.start.getTime() - right.slot.start.getTime());
    const displayDate = new Date(`${dateStr}T00:00:00`);
    const formattedDate = displayDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    });

    message += `\n${dayDistributions[0].slot.dayName} ${formattedDate}:\n`;

    dayDistributions.forEach((distribution) => {
      const totalMinutes = distribution.lessons.reduce(
        (sum, lesson) => sum + (lesson.durationMinutes || 15),
        0,
      );
      const adjustedEnd = new Date(distribution.slot.start.getTime() + totalMinutes * 60000);
      const startTime = distribution.slot.start.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      });
      const endTime = adjustedEnd.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      });

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
}: BuildStudyPlannerAudioSummaryInput): string {
  if (calendarEventsCount === 0) {
    return 'Calendario conectado. No encontre eventos en el proximo mes. ¿Que dias y horarios prefieres para estudiar?';
  }

  if (finalSlots.length > 0) {
    const firstSlot = finalSlots[0];
    const timeStr = firstSlot.start.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar el ${firstSlot.dayName} a las ${timeStr}. ¿Te parece bien?`;
  }

  if (daysWithFreeTime.length > 0) {
    const days = daysWithFreeTime.slice(0, 2).map((day) => day.dayName).join(' y ');
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar los ${days}. ¿Te parece bien?`;
  }

  return 'Analice tu calendario del proximo mes. Tu agenda esta muy ocupada, pero podemos encontrar espacios para estudiar. ¿Te parece bien?';
}
