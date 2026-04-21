import { StudyStrategyService, type StudyMode } from '@/features/study-planner/services/study-strategy.service';
import type { Lesson, PlannedDaySlot, PlanResult, Preferences, StudyBlock } from './generate-plan.types';
import { capitalize, generateTimeSlots, getWeekNumber } from './generate-plan-slots';

export function groupLessons(lessons: Lesson[]): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let currentBlock: StudyBlock | null = null;

  for (const lesson of lessons) {
    const title = lesson.lessonTitle.trim();
    const match =
      title.match(/^(?:Lecci[óo]n\s+)?(\d+)(?:\.(\d+))?/i)
      || title.match(/^(\d+)(?:\.(\d+))?/);

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
      currentBlock = { lessons: [lesson], totalDuration: lesson.durationMinutes };
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

const MODE_DESCRIPTIONS: Record<StudyMode, string> = {
  pomodoro: '🍅 Técnica Pomodoro (25 min estudio + 5 min descanso)',
  balanced: '⚖️ Modo Balanceado (descansos proporcionales)',
  intensive: '🔥 Modo Intensivo (descansos mínimos)',
};

export function generateDeterministicPlan(
  lessons: Lesson[],
  preferences: Preferences,
  deadlineDate?: string,
  maxSessionMinutes = 50,
): PlanResult {
  const studyMode: StudyMode = preferences.studyMode || 'balanced';
  const maxConsecutiveHours = preferences.maxConsecutiveHours || 2;
  const maxDailyMinutes = maxConsecutiveHours * 60;

  const blocks = groupLessons(lessons);
  const slots = generateTimeSlots(preferences, blocks.length);

  let currentBlockIndex = 0;
  const weeks: Record<number, Array<{ date: Date; slots: PlannedDaySlot[] }>> = {};
  const dailyStudyMinutes: Record<string, number> = {};

  for (const slot of slots) {
    if (currentBlockIndex >= blocks.length) break;

    const dateStr = slot.date.toDateString();
    if (!dailyStudyMinutes[dateStr]) dailyStudyMinutes[dateStr] = 0;
    if (dailyStudyMinutes[dateStr] >= maxDailyMinutes) continue;

    let slotDuration = 0;
    const slotBlocks: StudyBlock[] = [];

    const remainingDuration = blocks
      .slice(currentBlockIndex)
      .reduce((acc, b) => acc + b.totalDuration, 0);
    const remainingSlots = slots.length - slots.indexOf(slot);
    const balancedDuration = remainingSlots > 0 ? Math.ceil(remainingDuration / remainingSlots) : maxSessionMinutes;
    const optimalSessionDuration = Math.min(maxSessionMinutes, Math.max(20, balancedDuration * 1.5));

    let sessionLimitMinutes = Math.min(optimalSessionDuration, maxDailyMinutes);
    if (slot.workBlockEndTime) {
      const [startH, startM] = slot.time.split(':').map(Number);
      const [endH, endM] = slot.workBlockEndTime.split(':').map(Number);
      const available = endH * 60 + endM - (startH * 60 + startM);
      if (available < sessionLimitMinutes) sessionLimitMinutes = available;
    }

    while (currentBlockIndex < blocks.length) {
      const candidate = blocks[currentBlockIndex];
      if (
        dailyStudyMinutes[dateStr] + slotDuration + candidate.totalDuration > maxDailyMinutes
        && slotBlocks.length > 0
      ) break;
      if (slotDuration + candidate.totalDuration <= sessionLimitMinutes + 5 || slotBlocks.length === 0) {
        slotBlocks.push(candidate);
        slotDuration += candidate.totalDuration;
        currentBlockIndex++;
      } else {
        break;
      }
    }

    dailyStudyMinutes[dateStr] += slotDuration;

    const breakdownResult = StudyStrategyService.calculateBreaks(slotDuration, studyMode);
    const weekNum = getWeekNumber(slot.date, new Date(preferences.startDate || new Date()));
    if (!weeks[weekNum]) weeks[weekNum] = [];

    let dayEntry = weeks[weekNum].find((d) => d.date.toDateString() === slot.date.toDateString());
    if (!dayEntry) {
      dayEntry = { date: slot.date, slots: [] };
      weeks[weekNum].push(dayEntry);
    }

    const [startH, startM] = slot.time.split(':').map(Number);
    const endDate = new Date(slot.date);
    endDate.setHours(startH, startM + breakdownResult.totalMinutes);

    if (slot.workBlockEndTime) {
      const [wbH, wbM] = slot.workBlockEndTime.split(':').map(Number);
      const wbMs = new Date(slot.date).setHours(wbH, wbM, 0, 0);
      if (endDate.getTime() > wbMs) endDate.setTime(wbMs);
    }

    const endHStr = endDate.getHours().toString().padStart(2, '0');
    const endMStr = endDate.getMinutes().toString().padStart(2, '0');

    dayEntry.slots.push({
      start: slot.time,
      end: `${endHStr}:${endMStr}`,
      period: slot.period,
      blocks: slotBlocks,
      totalDuration: slotDuration,
      breakdownResult,
      studyMode,
    });
  }

  const sortedWeeks = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));
  if (sortedWeeks.length === 0) return 'No se pudo generar un plan con las preferencias dadas.';

  const lastWeekNum = Number(sortedWeeks[sortedWeeks.length - 1]);
  const lastWeekDays = weeks[lastWeekNum];
  const lastDate = lastWeekDays[lastWeekDays.length - 1].date;

  const startStr = weeks[Number(sortedWeeks[0])][0].date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
  const endStr = lastDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

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
        plan: null,
      };
    }
  }

  let planString = '';
  planString += `Estrategia de estudio: ${MODE_DESCRIPTIONS[studyMode]}\n`;
  planString += `Límite de horas consecutivas: ${maxConsecutiveHours}h\n\n`;

  for (const weekNum of sortedWeeks) {
    const days = weeks[Number(weekNum)];
    const wStart = days[0].date;
    const wEnd = days[days.length - 1].date;
    planString += `Semana ${Number(weekNum) + 1} (Fechas: ${wStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - ${wEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}):\n\n`;

    for (const day of days) {
      const dayName = day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
      planString += `${capitalize(dayName)}:\n`;

      for (const slot of day.slots) {
        planString += `* ${slot.start} - ${slot.end}: Sesión de Estudio (${capitalize(slot.period)})\n`;
        slot.blocks.forEach((blk) => {
          blk.lessons.forEach((l) => {
            planString += `- ${l.lessonTitle} (${l.durationMinutes} min) - Módulo: ${l.moduleTitle}\n`;
          });
        });

        if (slot.breakdownResult?.breaks.length > 0) {
          planString += `  📍 Descansos programados:\n`;
          slot.breakdownResult.breaks.forEach((brk) => {
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
  planString += `* Estrategia: ${MODE_DESCRIPTIONS[studyMode]}\n`;

  return planString;
}
