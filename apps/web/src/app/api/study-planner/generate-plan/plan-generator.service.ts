/**
 * Plan Generator Service
 *
 * Contains the pure business logic for generating deterministic study plans
 * and calculating valid schedule alternatives when a deadline cannot be met.
 */

import { StudyStrategyService, StudyMode, BreakInterval } from '@/features/study-planner/services/study-strategy.service';

export interface Lesson {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  durationMinutes: number;
}

export interface Preferences {
  days: string[]; // ['lunes', 'martes', ...]
  times: string[]; // ['mañana', 'tarde', 'noche']
  startDate?: string;
  studyMode?: StudyMode;
  maxConsecutiveHours?: number;
}

export interface StudyBlock {
  lessons: Lesson[];
  totalDuration: number;
  mainLessonNum?: string;
}

export interface ValidAlternative {
  id: string;
  description: string;
  days: string[];
  times: string[];
  sessionDuration: number;
  estimatedEndDate: string;
  daysBeforeDeadline: number;
}

export type PlanResult =
  | string
  | { exceedsDeadline: boolean; endDate: string; deadline: string; daysExcess: number; plan: null };

/**
 * Generates a deterministic study plan based on lessons, preferences, and optional deadline.
 */
export function generateDeterministicPlan(
  lessons: Lesson[],
  preferences: Preferences,
  deadlineDate?: string,
  maxSessionMinutes: number = 50
): PlanResult {
  const studyMode: StudyMode = preferences.studyMode || 'balanced';
  const maxConsecutiveHours = preferences.maxConsecutiveHours || 2;
  const maxDailyMinutes = maxConsecutiveHours * 60;

  const blocks = groupLessons(lessons);
  const slots = generateTimeSlots(preferences, blocks.length);

  let currentBlockIndex = 0;
  const weeks: { [key: number]: { date: Date; slots: unknown[] }[] } = {};
  const dailyStudyMinutes: { [dateStr: string]: number } = {};

  for (const slot of slots) {
    if (currentBlockIndex >= blocks.length) break;

    const dateStr = slot.date.toDateString();
    if (!dailyStudyMinutes[dateStr]) {
      dailyStudyMinutes[dateStr] = 0;
    }

    if (dailyStudyMinutes[dateStr] >= maxDailyMinutes) {
      continue;
    }

    let slotDuration = 0;
    const slotBlocks: StudyBlock[] = [];

    while (currentBlockIndex < blocks.length) {
      const candidateBlock = blocks[currentBlockIndex];

      if (dailyStudyMinutes[dateStr] + slotDuration + candidateBlock.totalDuration > maxDailyMinutes && slotBlocks.length > 0) {
        break;
      }

      if (slotDuration + candidateBlock.totalDuration <= maxSessionMinutes + 10 || slotBlocks.length === 0) {
        slotBlocks.push(candidateBlock);
        slotDuration += candidateBlock.totalDuration;
        currentBlockIndex++;
      } else {
        break;
      }
    }

    dailyStudyMinutes[dateStr] += slotDuration;

    const breakdownResult = StudyStrategyService.calculateBreaks(slotDuration, studyMode);
    const weekNum = getWeekNumber(slot.date, new Date(preferences.startDate || new Date()));

    if (!weeks[weekNum]) weeks[weekNum] = [];

    let dayEntry = weeks[weekNum].find(d => d.date.toDateString() === slot.date.toDateString());
    if (!dayEntry) {
      dayEntry = { date: slot.date, slots: [] };
      weeks[weekNum].push(dayEntry);
    }

    const startTimeParts = slot.time.split(':');
    const startHour = parseInt(startTimeParts[0]);
    const startMin = parseInt(startTimeParts[1]);

    const endDate = new Date(slot.date);
    endDate.setHours(startHour, startMin + breakdownResult.totalMinutes);

    const endHourStr = endDate.getHours().toString().padStart(2, '0');
    const endMinStr = endDate.getMinutes().toString().padStart(2, '0');

    dayEntry.slots.push({
      start: slot.time,
      end: `${endHourStr}:${endMinStr}`,
      period: slot.period,
      blocks: slotBlocks,
      totalDuration: slotDuration,
      breakdownResult,
      studyMode
    });
  }

  const sortedWeeks = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));

  if (sortedWeeks.length === 0) return 'No se pudo generar un plan con las preferencias dadas.';

  const startDate = weeks[Number(sortedWeeks[0])][0].date;
  const lastWeekNum = Number(sortedWeeks[sortedWeeks.length - 1]);
  const lastWeekDays = weeks[lastWeekNum];
  const lastDate = lastWeekDays[lastWeekDays.length - 1].date;

  const startStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const endStr = lastDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // Validate deadline before rendering plan text
  if (deadlineDate) {
    const deadline = new Date(deadlineDate);
    const checkDate = new Date(lastDate);
    checkDate.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    if (checkDate > deadline) {
      const deadlineStr = deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return {
        exceedsDeadline: true,
        endDate: endStr,
        deadline: deadlineStr,
        daysExcess: Math.ceil((checkDate.getTime() - deadline.getTime()) / (1000 * 3600 * 24)),
        plan: null
      };
    }
  }

  const modeDescriptions: Record<StudyMode, string> = {
    'pomodoro': '🍅 Técnica Pomodoro (25 min estudio + 5 min descanso)',
    'balanced': '⚖️ Modo Balanceado (descansos proporcionales)',
    'intensive': '🔥 Modo Intensivo (descansos mínimos)'
  };

  let planString = '';
  planString += `Estrategia de estudio: ${modeDescriptions[studyMode]}\n`;
  planString += `Límite de horas consecutivas: ${maxConsecutiveHours}h\n\n`;

  for (const weekNum of sortedWeeks) {
    const days = weeks[Number(weekNum)];
    const wStart = days[0].date;
    const wEnd = days[days.length - 1].date;

    planString += `Semana ${Number(weekNum) + 1} (Fechas: ${wStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - ${wEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}):\n\n`;

    for (const day of days) {
      const dayName = day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
      planString += `${capitalize(dayName)}:\n`;

      for (const slot of day.slots as Array<{
        start: string; end: string; period: string; blocks: StudyBlock[];
        totalDuration: number; breakdownResult: { breaks: BreakInterval[]; breakMinutes: number; pomodoroCount?: number; totalMinutes: number };
        studyMode: StudyMode;
      }>) {
        planString += `* ${slot.start} - ${slot.end}: Sesión de Estudio (${capitalize(slot.period)})\n`;

        slot.blocks.forEach((blk) => {
          blk.lessons.forEach((l) => {
            planString += `- ${l.lessonTitle} (${l.durationMinutes} min) - Módulo: ${l.moduleTitle}\n`;
          });
        });

        if (slot.breakdownResult && slot.breakdownResult.breaks.length > 0) {
          planString += `  📍 Descansos programados:\n`;
          slot.breakdownResult.breaks.forEach((brk: BreakInterval) => {
            const icon = brk.type === 'long' ? '🌟' : brk.type === 'short' ? '☕' : '⏸️';
            planString += `     ${icon} A los ${brk.afterMinutes} min: ${brk.durationMinutes} min de descanso\n`;
          });
        }

        if (slot.breakdownResult?.pomodoroCount) {
          planString += `  🍅 Pomodoros en esta sesión: ${slot.breakdownResult.pomodoroCount}\n`;
        }

        planString += `  ↳ Total: ${slot.totalDuration} min estudio + ${slot.breakdownResult?.breakMinutes || 0} min descansos\n`;
      }
      planString += '\n';
    }
  }

  planString += `Resumen del plan:\n`;
  planString += `* Total de lecciones: ${lessons.length}\n`;
  planString += `* Semanas de estudio: ${sortedWeeks.length}\n`;
  planString += `* Fecha de finalización: ${endStr}\n`;
  planString += `* Estrategia: ${modeDescriptions[studyMode]}\n`;

  return planString;
}

/**
 * Calculates valid schedule alternatives that allow finishing before the deadline.
 */
export function calculateValidAlternatives(
  lessons: Lesson[],
  currentPrefs: Preferences,
  deadlineDate: string,
  maxSessionMinutes: number
): ValidAlternative[] {
  const validAlternatives: ValidAlternative[] = [];
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const allDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const allTimes = ['mañana', 'tarde', 'noche'];

  const currentDays = currentPrefs.days.map(d => d.toLowerCase());
  const currentTimes = currentPrefs.times.map(t => t.toLowerCase());
  const missingDays = allDays.filter(d => !currentDays.includes(d));
  const missingTimes = allTimes.filter(t => !currentTimes.includes(t));

  const testConfiguration = (days: string[], times: string[], sessionDuration: number): { valid: boolean; endDate: Date | null } => {
    const testPrefs: Preferences = { days, times, startDate: currentPrefs.startDate };
    const result = generateDeterministicPlan(lessons, testPrefs, undefined, sessionDuration);

    if (typeof result === 'string') {
      const match = result.match(/Fecha de finalización:\s*(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i);
      if (match) {
        const monthMap: { [key: string]: number } = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
          'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        const day = parseInt(match[1]);
        const month = monthMap[match[2].toLowerCase()];
        const year = parseInt(match[3]);
        const endDate = new Date(year, month, day);
        endDate.setHours(0, 0, 0, 0);
        return { valid: endDate <= deadline, endDate };
      }
    }
    return { valid: false, endDate: null };
  };

  // Option 1: Add weekends
  if (!currentDays.includes('sábado')) {
    const daysWithSat = [...currentDays, 'sábado'];
    const result = testConfiguration(daysWithSat, currentTimes, maxSessionMinutes);
    if (result.valid && result.endDate) {
      const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
      validAlternatives.push({
        id: 'add_saturday',
        description: `Agregar sábado a tus días de estudio`,
        days: daysWithSat,
        times: currentTimes,
        sessionDuration: maxSessionMinutes,
        estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysBeforeDeadline
      });
    }
  }

  const weekendDays = ['sábado', 'domingo'].filter(d => !currentDays.includes(d));
  if (weekendDays.length === 2) {
    const daysWithWeekend = [...currentDays, 'sábado', 'domingo'];
    const result = testConfiguration(daysWithWeekend, currentTimes, maxSessionMinutes);
    if (result.valid && result.endDate) {
      const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
      validAlternatives.push({
        id: 'add_weekend',
        description: `Agregar sábado y domingo a tus días de estudio`,
        days: daysWithWeekend,
        times: currentTimes,
        sessionDuration: maxSessionMinutes,
        estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysBeforeDeadline
      });
    }
  }

  // Option 2: Add more weekdays
  const weekdaysMissing = missingDays.filter(d => !['sábado', 'domingo'].includes(d));
  for (let i = 1; i <= Math.min(weekdaysMissing.length, 3); i++) {
    const additionalDays = weekdaysMissing.slice(0, i);
    const newDays = [...currentDays, ...additionalDays];
    const result = testConfiguration(newDays, currentTimes, maxSessionMinutes);
    if (result.valid && result.endDate) {
      const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
      const alreadyExists = validAlternatives.some(a =>
        JSON.stringify(a.days.sort()) === JSON.stringify(newDays.sort())
      );
      if (!alreadyExists) {
        validAlternatives.push({
          id: `add_weekdays_${i}`,
          description: `Agregar ${additionalDays.join(' y ')} a tus días de estudio`,
          days: newDays,
          times: currentTimes,
          sessionDuration: maxSessionMinutes,
          estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          daysBeforeDeadline
        });
      }
      break;
    }
  }

  // Option 3: Add more time slots
  if (currentTimes.length < 3 && missingTimes.length > 0) {
    for (const additionalTime of missingTimes) {
      const newTimes = [...currentTimes, additionalTime];
      const result = testConfiguration(currentDays, newTimes, maxSessionMinutes);
      if (result.valid && result.endDate) {
        const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
        validAlternatives.push({
          id: `add_time_${additionalTime}`,
          description: `Agregar sesiones en la ${additionalTime} además de la ${currentTimes.join(' y ')}`,
          days: currentDays,
          times: newTimes,
          sessionDuration: maxSessionMinutes,
          estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          daysBeforeDeadline
        });
        break;
      }
    }
  }

  // Option 4: Increase session duration (increments of 15 min)
  for (let extraMinutes = 15; extraMinutes <= 60; extraMinutes += 15) {
    const newDuration = maxSessionMinutes + extraMinutes;
    const result = testConfiguration(currentDays, currentTimes, newDuration);
    if (result.valid && result.endDate) {
      const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
      validAlternatives.push({
        id: `increase_duration_${extraMinutes}`,
        description: `Aumentar cada sesión a ${newDuration} minutos (+${extraMinutes} min)`,
        days: currentDays,
        times: currentTimes,
        sessionDuration: newDuration,
        estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysBeforeDeadline
      });
      break;
    }
  }

  // Option 5: Combine add days + increase duration (fallback when nothing else works)
  if (validAlternatives.length === 0) {
    const allDaysPossible = [...new Set([...currentDays, ...missingDays.slice(0, 2)])];
    for (let extraMinutes = 15; extraMinutes <= 90; extraMinutes += 15) {
      const newDuration = maxSessionMinutes + extraMinutes;
      const result = testConfiguration(allDaysPossible, currentTimes, newDuration);
      if (result.valid && result.endDate) {
        const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
        const addedDays = missingDays.slice(0, 2).filter(d => !currentDays.includes(d));
        validAlternatives.push({
          id: 'combo_days_duration',
          description: `Agregar ${addedDays.join(' y ')} + sesiones de ${newDuration} min`,
          days: allDaysPossible,
          times: currentTimes,
          sessionDuration: newDuration,
          estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          daysBeforeDeadline
        });
        break;
      }
    }
  }

  // Option 6: Intensive — every day, multiple time slots
  if (validAlternatives.length < 3) {
    const intensiveDays = allDays;
    const intensiveTimes = currentTimes.length < 2 ? [...currentTimes, missingTimes[0] || 'tarde'] : currentTimes;
    const result = testConfiguration(intensiveDays, intensiveTimes, maxSessionMinutes + 30);
    if (result.valid && result.endDate) {
      const daysBeforeDeadline = Math.ceil((deadline.getTime() - result.endDate.getTime()) / (1000 * 3600 * 24));
      validAlternatives.push({
        id: 'intensive',
        description: `Plan intensivo: estudiar todos los días con sesiones de ${maxSessionMinutes + 30} min`,
        days: intensiveDays,
        times: intensiveTimes,
        sessionDuration: maxSessionMinutes + 30,
        estimatedEndDate: result.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysBeforeDeadline
      });
    }
  }

  validAlternatives.sort((a, b) => b.daysBeforeDeadline - a.daysBeforeDeadline);
  return validAlternatives.slice(0, 4);
}

// ---- Helpers ----

function groupLessons(lessons: Lesson[]): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let currentBlock: StudyBlock | null = null;

  for (const lesson of lessons) {
    const title = lesson.lessonTitle.trim();
    const match = title.match(/^(?:Lecci[óo]n\s+)?(\d+)(?:\.(\d+))?/i) || title.match(/^(\d+)(?:\.(\d+))?/);

    if (match) {
      const mainNum = match[1];

      if (currentBlock && currentBlock.mainLessonNum === mainNum) {
        currentBlock.lessons.push(lesson);
        currentBlock.totalDuration += lesson.durationMinutes;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { lessons: [lesson], totalDuration: lesson.durationMinutes, mainLessonNum: mainNum };
      }
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { lessons: [lesson], totalDuration: lesson.durationMinutes, mainLessonNum: undefined };
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

function generateTimeSlots(
  prefs: Preferences,
  minSlotsNeeded: number
): { date: Date; time: string; period: string }[] {
  const slots: { date: Date; time: string; period: string }[] = [];
  const start = new Date(prefs.startDate || new Date());

  const dayMap: { [key: string]: number } = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3,
    'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6
  };

  const targetDays = prefs.days.map(d => dayMap[d.toLowerCase().trim()]).filter(d => d !== undefined);
  if (targetDays.length === 0) targetDays.push(1, 2, 3, 4, 5);

  const timeMap: { [key: string]: string } = { 'mañana': '08:00', 'tarde': '14:00', 'noche': '20:00' };
  const targetTimes = prefs.times.map(t => ({
    period: t.toLowerCase(),
    time: timeMap[t.toLowerCase()] || '09:00'
  }));
  if (targetTimes.length === 0) targetTimes.push({ period: 'mañana', time: '09:00' });

  let currentDate = new Date(start);
  if (currentDate.getHours() > 18) currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0, 0, 0, 0);

  let iterations = 0;
  while (slots.length < minSlotsNeeded && iterations < 730) {
    const dayOfWeek = currentDate.getDay();

    if (targetDays.includes(dayOfWeek)) {
      for (const timeConfig of targetTimes) {
        const slotDate = new Date(currentDate);
        slots.push({ date: slotDate, time: timeConfig.time, period: timeConfig.period });
        if (slots.length >= minSlotsNeeded) break;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }

  return slots;
}

function getWeekNumber(date: Date, startDate: Date): number {
  const diff = date.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
