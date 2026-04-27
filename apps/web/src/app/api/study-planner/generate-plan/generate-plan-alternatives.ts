import type { Lesson, Preferences, ValidAlternative } from './generate-plan.types';
import { generateDeterministicPlan } from './generate-plan-engine';

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
const SATURDAY = 'sábado';
const SUNDAY = 'domingo';
const ALL_DAYS_WITHOUT_SUNDAY = [...WEEKDAYS, SATURDAY];
const ALL_DAYS_WITH_SUNDAY = [...ALL_DAYS_WITHOUT_SUNDAY, SUNDAY];
const ALL_TIMES = ['mañana', 'tarde', 'noche'];

const MONTH_MAP: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function testConfiguration(
  lessons: Lesson[],
  days: string[],
  times: string[],
  startDate: string | undefined,
  sessionDuration: number,
  deadline: Date,
): { valid: boolean; endDate: Date | null } {
  const testPrefs: Preferences = { days, times, startDate, allowSunday: days.includes(SUNDAY) };
  const result = generateDeterministicPlan(lessons, testPrefs, undefined, sessionDuration);

  if (typeof result === 'string') {
    const match = result.match(/Fecha de finalización:\s*(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i);
    if (match) {
      const endDate = new Date(
        parseInt(match[3], 10),
        MONTH_MAP[match[2].toLowerCase()],
        parseInt(match[1], 10),
      );
      endDate.setHours(0, 0, 0, 0);
      return { valid: endDate <= deadline, endDate };
    }
  }

  return { valid: false, endDate: null };
}

function addAlternative(
  alternatives: ValidAlternative[],
  id: string,
  description: string,
  days: string[],
  times: string[],
  sessionDuration: number,
  endDate: Date,
  deadline: Date,
): void {
  const daysBeforeDeadline = Math.ceil((deadline.getTime() - endDate.getTime()) / (1000 * 3600 * 24));
  alternatives.push({
    id,
    description,
    days,
    times,
    sessionDuration,
    estimatedEndDate: endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    daysBeforeDeadline,
  });
}

function addAlternativeIfValid(params: {
  alternatives: ValidAlternative[];
  id: string;
  description: string;
  lessons: Lesson[];
  days: string[];
  times: string[];
  startDate: string | undefined;
  sessionDuration: number;
  deadline: Date;
}): boolean {
  const result = testConfiguration(
    params.lessons,
    params.days,
    params.times,
    params.startDate,
    params.sessionDuration,
    params.deadline,
  );

  if (!result.valid || !result.endDate) {
    return false;
  }

  addAlternative(
    params.alternatives,
    params.id,
    params.description,
    params.days,
    params.times,
    params.sessionDuration,
    result.endDate,
    params.deadline,
  );

  return true;
}

export function calculateValidAlternatives(
  lessons: Lesson[],
  currentPrefs: Preferences,
  deadlineDate: string,
  maxSessionMinutes: number,
  allowSunday = Boolean(currentPrefs.allowSunday),
): ValidAlternative[] {
  const alternatives: ValidAlternative[] = [];
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const allDays = allowSunday ? ALL_DAYS_WITH_SUNDAY : ALL_DAYS_WITHOUT_SUNDAY;
  const currentDays = currentPrefs.days
    .map((day) => day.toLowerCase())
    .filter((day) => day !== SUNDAY || allowSunday);
  const currentTimes = currentPrefs.times.map((time) => time.toLowerCase());
  const missingDays = allDays.filter((day) => !currentDays.includes(day));
  const missingTimes = ALL_TIMES.filter((time) => !currentTimes.includes(time));
  const startDate = currentPrefs.startDate;

  for (const day of allowSunday ? [SATURDAY, SUNDAY] : [SATURDAY]) {
    if (!currentDays.includes(day)) {
      addAlternativeIfValid({
        alternatives,
        id: `add_${day}`,
        description: `Agregar ${day} a tus días de estudio`,
        lessons,
        days: [...currentDays, day],
        times: currentTimes,
        startDate,
        sessionDuration: maxSessionMinutes,
        deadline,
      });
    }
  }

  if (allowSunday) {
    const weekendMissing = [SATURDAY, SUNDAY].filter((day) => !currentDays.includes(day));
    if (weekendMissing.length === 2) {
      addAlternativeIfValid({
        alternatives,
        id: 'add_weekend',
        description: 'Agregar sábado y domingo a tus días de estudio',
        lessons,
        days: [...currentDays, SATURDAY, SUNDAY],
        times: currentTimes,
        startDate,
        sessionDuration: maxSessionMinutes,
        deadline,
      });
    }
  }

  const weekdaysMissing = missingDays.filter((day) => ![SATURDAY, SUNDAY].includes(day));
  for (let index = 1; index <= Math.min(weekdaysMissing.length, 3); index += 1) {
    const added = weekdaysMissing.slice(0, index);
    const newDays = [...currentDays, ...added];
    const alreadyExists = alternatives.some(
      (alternative) => JSON.stringify([...alternative.days].sort()) === JSON.stringify([...newDays].sort()),
    );

    if (!alreadyExists && addAlternativeIfValid({
      alternatives,
      id: `add_weekdays_${index}`,
      description: `Agregar ${added.join(' y ')} a tus días de estudio`,
      lessons,
      days: newDays,
      times: currentTimes,
      startDate,
      sessionDuration: maxSessionMinutes,
      deadline,
    })) {
      break;
    }
  }

  if (currentTimes.length < 3) {
    for (const additionalTime of missingTimes) {
      if (addAlternativeIfValid({
        alternatives,
        id: `add_time_${additionalTime}`,
        description: `Agregar sesiones en la ${additionalTime} además de la ${currentTimes.join(' y ')}`,
        lessons,
        days: currentDays,
        times: [...currentTimes, additionalTime],
        startDate,
        sessionDuration: maxSessionMinutes,
        deadline,
      })) {
        break;
      }
    }
  }

  for (let extra = 15; extra <= 60; extra += 15) {
    const newDuration = maxSessionMinutes + extra;
    if (addAlternativeIfValid({
      alternatives,
      id: `increase_duration_${extra}`,
      description: `Aumentar cada sesión a ${newDuration} minutos (+${extra} min)`,
      lessons,
      days: currentDays,
      times: currentTimes,
      startDate,
      sessionDuration: newDuration,
      deadline,
    })) {
      break;
    }
  }

  if (alternatives.length === 0) {
    const allDaysPossible = [...new Set([...currentDays, ...missingDays.slice(0, 2)])];
    const addedDays = missingDays.slice(0, 2).filter((day) => !currentDays.includes(day));

    for (let extra = 15; extra <= 90; extra += 15) {
      const newDuration = maxSessionMinutes + extra;
      if (addAlternativeIfValid({
        alternatives,
        id: 'combo_days_duration',
        description: `Agregar ${addedDays.join(' y ')} + sesiones de ${newDuration} min`,
        lessons,
        days: allDaysPossible,
        times: currentTimes,
        startDate,
        sessionDuration: newDuration,
        deadline,
      })) {
        break;
      }
    }
  }

  if (alternatives.length < 3) {
    const intensiveTimes =
      currentTimes.length < 2 ? [...currentTimes, missingTimes[0] || 'tarde'] : currentTimes;
    const description = allowSunday
      ? `Plan intensivo: estudiar todos los días con sesiones de ${maxSessionMinutes + 30} min`
      : `Plan intensivo: estudiar lunes a sábado con sesiones de ${maxSessionMinutes + 30} min`;

    addAlternativeIfValid({
      alternatives,
      id: 'intensive',
      description,
      lessons,
      days: allDays,
      times: intensiveTimes,
      startDate,
      sessionDuration: maxSessionMinutes + 30,
      deadline,
    });
  }

  alternatives.sort((left, right) => right.daysBeforeDeadline - left.daysBeforeDeadline);
  return alternatives.slice(0, 4);
}
