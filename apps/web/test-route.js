import * as fs from 'fs';
import * as path from 'path';

// Copia las funciones internas de route.ts aquí para simular el comportamiento.
const prefs = {
  days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
  times: ['tarde'],
  availabilityMap: {
    "2026-04-08": {
       date: "2026-04-08",
       freeSlots: [
         { startHour: 9, startMinute: 0, endHour: 14, endMinute: 0 },
         { startHour: 15, startMinute: 0, endHour: 16, endMinute: 0 }
       ],
       busySlots: [],
       totalFreeMinutes: 360,
       totalBusyMinutes: 120
    }
  },
  calendarStartTimesByDay: {
    "2026-04-08": "09:00"
  },
  calendarEndTimesByDay: {
    "2026-04-08": "17:00"
  }
};

const blocks = Array(14).fill(0).map((_, i) => ({
  totalDuration: 50,
  lessons: [{ lessonTitle: `L${i}`, durationMinutes: 50, moduleTitle: '' }]
}));

// Simulamos la generación
function generateTimeSlots(prefs, minSlotsNeeded) {
  const slots = [];
  let currentDate = new Date('2026-04-08T00:00:00');
  
  const targetDays = [1, 2, 3, 4, 5];
  const fallbackTimes = [{ period: 'tarde', time: '14:00' }];

  let iterations = 0;
  while (slots.length < minSlotsNeeded && iterations < 730) {
    if (targetDays.includes(currentDate.getDay())) {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      const calendarStartTime = prefs.calendarStartTimesByDay?.[dateKey];
      const calendarEndTime = prefs.calendarEndTimesByDay?.[dateKey];
      const availDay = prefs.availabilityMap?.[dateKey];

      let targetTimes = [];
      if (availDay && availDay.freeSlots && availDay.freeSlots.length > 0) {
        for (const freeSlot of availDay.freeSlots) {
          const startStr = `${freeSlot.startHour.toString().padStart(2, '0')}:${freeSlot.startMinute.toString().padStart(2, '0')}`;
          const endStr = `${freeSlot.endHour.toString().padStart(2, '0')}:${freeSlot.endMinute.toString().padStart(2, '0')}`;
          targetTimes.push({ period: 'libre', time: startStr, blockLimit: endStr });
        }
      } else {
        targetTimes = fallbackTimes.map(t => ({ ...t, blockLimit: undefined }));
      }

      for (const timeConfig of targetTimes) {
        slots.push({ date: new Date(currentDate), time: timeConfig.time, period: timeConfig.period, workBlockEndTime: timeConfig.blockLimit });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }
  return slots;
}

const slots = generateTimeSlots(prefs, 14);
console.log(JSON.stringify(slots.slice(0, 3), null, 2));

