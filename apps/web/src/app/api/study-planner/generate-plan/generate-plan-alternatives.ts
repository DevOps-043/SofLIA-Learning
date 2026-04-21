import type { Lesson, Preferences, ValidAlternative } from './generate-plan.types';
import { generateDeterministicPlan } from './generate-plan-engine';

const ALL_DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const ALL_TIMES = ['mañana', 'tarde', 'noche'];

const MONTH_MAP: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function testConfiguration(
  lessons: Lesson[],
  days: string[],
  times: string[],
  startDate: string | undefined,
  sessionDuration: number,
  deadline: Date,
): { valid: boolean; endDate: Date | null } {
  const testPrefs: Preferences = { days, times, startDate };
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

export function calculateValidAlternatives(
  lessons: Lesson[],
  currentPrefs: Preferences,
  deadlineDate: string,
  maxSessionMinutes: number,
): ValidAlternative[] {
  const alternatives: ValidAlternative[] = [];
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const currentDays = currentPrefs.days.map((d) => d.toLowerCase());
  const currentTimes = currentPrefs.times.map((t) => t.toLowerCase());
  const missingDays = ALL_DAYS.filter((d) => !currentDays.includes(d));
  const missingTimes = ALL_TIMES.filter((t) => !currentTimes.includes(t));
  const startDate = currentPrefs.startDate;

  // Option 1: Add weekend days
  for (const day of ['sábado', 'domingo']) {
    if (!currentDays.includes(day)) {
      const newDays = [...currentDays, day];
      const result = testConfiguration(lessons, newDays, currentTimes, startDate, maxSessionMinutes, deadline);
      if (result.valid && result.endDate) {
        addAlternative(alternatives, `add_${day}`, `Agregar ${day} a tus días de estudio`, newDays, currentTimes, maxSessionMinutes, result.endDate, deadline);
      }
    }
  }

  // Add both weekend days
  const weekendMissing = ['sábado', 'domingo'].filter((d) => !currentDays.includes(d));
  if (weekendMissing.length === 2) {
    const newDays = [...currentDays, 'sábado', 'domingo'];
    const result = testConfiguration(lessons, newDays, currentTimes, startDate, maxSessionMinutes, deadline);
    if (result.valid && result.endDate) {
      addAlternative(alternatives, 'add_weekend', 'Agregar sábado y domingo a tus días de estudio', newDays, currentTimes, maxSessionMinutes, result.endDate, deadline);
    }
  }

  // Option 2: Add weekdays
  const weekdaysMissing = missingDays.filter((d) => !['sábado', 'domingo'].includes(d));
  for (let i = 1; i <= Math.min(weekdaysMissing.length, 3); i++) {
    const added = weekdaysMissing.slice(0, i);
    const newDays = [...currentDays, ...added];
    const result = testConfiguration(lessons, newDays, currentTimes, startDate, maxSessionMinutes, deadline);
    if (result.valid && result.endDate) {
      const alreadyExists = alternatives.some(
        (a) => JSON.stringify(a.days.sort()) === JSON.stringify([...newDays].sort()),
      );
      if (!alreadyExists) {
        addAlternative(alternatives, `add_weekdays_${i}`, `Agregar ${added.join(' y ')} a tus días de estudio`, newDays, currentTimes, maxSessionMinutes, result.endDate, deadline);
        break;
      }
    }
  }

  // Option 3: Add time periods
  if (currentTimes.length < 3) {
    for (const additionalTime of missingTimes) {
      const newTimes = [...currentTimes, additionalTime];
      const result = testConfiguration(lessons, currentDays, newTimes, startDate, maxSessionMinutes, deadline);
      if (result.valid && result.endDate) {
        addAlternative(alternatives, `add_time_${additionalTime}`, `Agregar sesiones en la ${additionalTime} además de la ${currentTimes.join(' y ')}`, currentDays, newTimes, maxSessionMinutes, result.endDate, deadline);
        break;
      }
    }
  }

  // Option 4: Increase session duration
  for (let extra = 15; extra <= 60; extra += 15) {
    const newDuration = maxSessionMinutes + extra;
    const result = testConfiguration(lessons, currentDays, currentTimes, startDate, newDuration, deadline);
    if (result.valid && result.endDate) {
      addAlternative(alternatives, `increase_duration_${extra}`, `Aumentar cada sesión a ${newDuration} minutos (+${extra} min)`, currentDays, currentTimes, newDuration, result.endDate, deadline);
      break;
    }
  }

  // Option 5: Combo days + duration (fallback)
  if (alternatives.length === 0) {
    const allDaysPossible = [...new Set([...currentDays, ...missingDays.slice(0, 2)])];
    for (let extra = 15; extra <= 90; extra += 15) {
      const newDuration = maxSessionMinutes + extra;
      const result = testConfiguration(lessons, allDaysPossible, currentTimes, startDate, newDuration, deadline);
      if (result.valid && result.endDate) {
        const addedDays = missingDays.slice(0, 2).filter((d) => !currentDays.includes(d));
        addAlternative(alternatives, 'combo_days_duration', `Agregar ${addedDays.join(' y ')} + sesiones de ${newDuration} min`, allDaysPossible, currentTimes, newDuration, result.endDate, deadline);
        break;
      }
    }
  }

  // Option 6: Intensive plan (fallback)
  if (alternatives.length < 3) {
    const intensiveTimes =
      currentTimes.length < 2 ? [...currentTimes, missingTimes[0] || 'tarde'] : currentTimes;
    const result = testConfiguration(lessons, ALL_DAYS, intensiveTimes, startDate, maxSessionMinutes + 30, deadline);
    if (result.valid && result.endDate) {
      addAlternative(alternatives, 'intensive', `Plan intensivo: estudiar todos los días con sesiones de ${maxSessionMinutes + 30} min`, ALL_DAYS, intensiveTimes, maxSessionMinutes + 30, result.endDate, deadline);
    }
  }

  alternatives.sort((a, b) => b.daysBeforeDeadline - a.daysBeforeDeadline);
  return alternatives.slice(0, 4);
}
