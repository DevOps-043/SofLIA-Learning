import type { GeneratedTimeSlot, Preferences } from './generate-plan.types';

export function getWeekNumber(date: Date, startDate: Date): number {
  const diff = date.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DAY_MAP: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
  jueves: 4, viernes: 5, sabado: 6, sábado: 6,
};

const TIME_MAP: Record<string, string> = {
  mañana: '08:00', manana: '08:00', tarde: '14:00', noche: '20:00',
};

export function generateTimeSlots(prefs: Preferences, minSlotsNeeded: number): GeneratedTimeSlot[] {
  const slots: GeneratedTimeSlot[] = [];
  const start = new Date(prefs.startDate || new Date());

  const targetDays = prefs.days
    .map((d) => DAY_MAP[d.toLowerCase().trim()])
    .filter((d) => d !== undefined);
  if (targetDays.length === 0) targetDays.push(1, 2, 3, 4, 5);

  const fallbackTimes = prefs.times.map((t) => ({
    period: t.toLowerCase(),
    time: TIME_MAP[t.toLowerCase()] || '09:00',
  }));
  if (fallbackTimes.length === 0) fallbackTimes.push({ period: 'mañana', time: '09:00' });

  let currentDate = new Date(start);
  if (currentDate.getHours() > 18) currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0, 0, 0, 0);

  let iterations = 0;
  while (slots.length < minSlotsNeeded && iterations < 730) {
    const dayOfWeek = currentDate.getDay();

    if (targetDays.includes(dayOfWeek)) {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const calendarStartTime = prefs.calendarStartTimesByDay?.[dateKey];
      const calendarEndTime = prefs.calendarEndTimesByDay?.[dateKey];
      const availDay = prefs.availabilityMap?.[dateKey];

      let targetTimes: Array<{ period: string; time: string; blockLimit?: string }> = [];

      if (availDay?.freeSlots && availDay.freeSlots.length > 0) {
        for (const freeSlot of availDay.freeSlots) {
          const startStr = `${freeSlot.startHour.toString().padStart(2, '0')}:${freeSlot.startMinute.toString().padStart(2, '0')}`;
          const endStr = `${freeSlot.endHour.toString().padStart(2, '0')}:${freeSlot.endMinute.toString().padStart(2, '0')}`;
          targetTimes.push({ period: 'libre', time: startStr, blockLimit: endStr });
        }
      } else if (calendarStartTime && calendarEndTime) {
        targetTimes = fallbackTimes.map((ft) => {
          const [wbStartH, wbStartM] = calendarStartTime.split(':').map(Number);
          const [wbEndH, wbEndM] = calendarEndTime.split(':').map(Number);
          const [prefH, prefM] = ft.time.split(':').map(Number);
          const prefMins = prefH * 60 + prefM;
          const startMins = wbStartH * 60 + wbStartM;
          const endMins = wbEndH * 60 + wbEndM;
          let finalMins = prefMins;
          if (finalMins < startMins) finalMins = startMins;
          if (finalMins > endMins - 15) finalMins = endMins - 15;
          if (finalMins < startMins) finalMins = startMins;
          const finalH = Math.floor(finalMins / 60).toString().padStart(2, '0');
          const finalM = (finalMins % 60).toString().padStart(2, '0');
          return { period: ft.period, time: `${finalH}:${finalM}`, blockLimit: calendarEndTime };
        });
      } else if (calendarStartTime) {
        targetTimes = [{ period: 'laboral', time: calendarStartTime }];
      } else {
        targetTimes = fallbackTimes.map((t) => ({ ...t, blockLimit: undefined }));
      }

      for (const timeConfig of targetTimes) {
        if (timeConfig.blockLimit) {
          const [startH, startM] = timeConfig.time.split(':').map(Number);
          const [endH, endM] = timeConfig.blockLimit.split(':').map(Number);
          const available = (endH * 60 + endM) - (startH * 60 + startM);
          if (available < 15) continue;
        }
        slots.push({
          date: new Date(currentDate),
          time: timeConfig.time,
          period: timeConfig.period,
          workBlockEndTime: timeConfig.blockLimit,
        });
        if (slots.length >= minSlotsNeeded) break;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }

  return slots;
}
