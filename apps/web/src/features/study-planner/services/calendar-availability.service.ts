/**
 * CalendarAvailabilityService
 *
 * Availability analysis based on calendar events:
 * - Analyze busy/free time blocks per day
 * - Find free time slots that meet minimum duration requirements
 */

import type {
  CalendarEvent,
  CalendarAvailability,
  TimeBlock,
} from '../types/user-context.types';

export class CalendarAvailabilityService {
  /**
   * Analiza la disponibilidad basándose en eventos del calendario
   */
  static analyzeAvailability(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date,
    preferredDays: number[] = [1, 2, 3, 4, 5], // Lunes a viernes por defecto
    workingHours: { start: number; end: number } = { start: 8, end: 20 }
  ): CalendarAvailability[] {
    const availability: CalendarAvailability[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (preferredDays.includes(dayOfWeek)) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(workingHours.start, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(workingHours.end, 0, 0, 0);

        // Obtener eventos del día
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return eventStart.toDateString() === currentDate.toDateString() ||
            (eventStart < dayEnd && eventEnd > dayStart);
        });

        // Calcular slots ocupados
        const busySlots: TimeBlock[] = [];
        for (const event of dayEvents) {
          if (event.status === 'cancelled') continue;

          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);

          busySlots.push({
            startHour: eventStart.getHours(),
            startMinute: eventStart.getMinutes(),
            endHour: eventEnd.getHours(),
            endMinute: eventEnd.getMinutes(),
          });
        }

        // Ordenar slots ocupados
        busySlots.sort((a, b) =>
          (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
        );

        // Calcular slots libres
        const freeSlots: TimeBlock[] = [];
        let lastEndHour = workingHours.start;
        let lastEndMinute = 0;

        for (const busy of busySlots) {
          if (busy.startHour * 60 + busy.startMinute > lastEndHour * 60 + lastEndMinute) {
            freeSlots.push({
              startHour: lastEndHour,
              startMinute: lastEndMinute,
              endHour: busy.startHour,
              endMinute: busy.startMinute,
            });
          }

          const busyEndMinutes = busy.endHour * 60 + busy.endMinute;
          const lastEndMinutes = lastEndHour * 60 + lastEndMinute;
          if (busyEndMinutes > lastEndMinutes) {
            lastEndHour = busy.endHour;
            lastEndMinute = busy.endMinute;
          }
        }

        // Agregar slot libre al final del día si hay
        if (lastEndHour * 60 + lastEndMinute < workingHours.end * 60) {
          freeSlots.push({
            startHour: lastEndHour,
            startMinute: lastEndMinute,
            endHour: workingHours.end,
            endMinute: 0,
          });
        }

        // Calcular totales
        let totalFreeMinutes = 0;
        for (const slot of freeSlots) {
          totalFreeMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }

        let totalBusyMinutes = 0;
        for (const slot of busySlots) {
          totalBusyMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }

        availability.push({
          date: currentDate.toISOString().split('T')[0],
          freeSlots,
          busySlots,
          totalFreeMinutes,
          totalBusyMinutes,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  }

  /**
   * Encuentra slots libres que cumplan con la duración mínima requerida
   */
  static findFreeTimeSlots(
    availability: CalendarAvailability[],
    minDurationMinutes: number
  ): Array<{ date: string; slot: TimeBlock }> {
    const suitableSlots: Array<{ date: string; slot: TimeBlock }> = [];

    for (const day of availability) {
      for (const slot of day.freeSlots) {
        const slotDuration = (slot.endHour * 60 + slot.endMinute) -
          (slot.startHour * 60 + slot.startMinute);

        if (slotDuration >= minDurationMinutes) {
          suitableSlots.push({
            date: day.date,
            slot,
          });
        }
      }
    }

    return suitableSlots;
  }
}
