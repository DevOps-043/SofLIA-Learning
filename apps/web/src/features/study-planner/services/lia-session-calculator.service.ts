export class LiaSessionCalculatorService {
  static preCalculateStudySessions(
    lessons: Array<{
      lessonTitle: string;
      lessonOrderIndex: number;
      moduleTitle: string;
      durationMinutes: number;
    }>,
    config: {
      studyDays: string[];  // ej: ["lunes", "martes"]
      timeSlots: string[];  // ej: ["mañana", "noche"]
      startDate: Date;
      targetDate?: Date;
    }
  ): {
    sessions: Array<{
      weekNumber: number;
      dayName: string;
      date: string;
      timeSlot: string;
      startTime: string;
      endTime: string;
      totalMinutes: number;
      lessons: Array<{
        title: string;
        duration: number;
      }>;
    }>;
    summary: {
      totalWeeks: number;
      totalSessions: number;
      totalLessons: number;
      finishDate: string;
    };
  } {
    const sessions: Array<{
      weekNumber: number;
      dayName: string;
      date: string;
      timeSlot: string;
      startTime: string;
      endTime: string;
      totalMinutes: number;
      lessons: Array<{ title: string; duration: number }>;
    }> = [];

    const groupedLessons = this.groupDecimalLessons(lessons);

    const slotTimes: Record<string, string> = {
      'mañana': '08:00',
      'tarde': '14:00',
      'noche': '20:00'
    };

    const dayNumbers: Record<string, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3,
      'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
    };

    // Obtener los días disponibles ordenados
    const availableDays = config.studyDays
      .map(d => d.toLowerCase().trim())
      .filter(d => dayNumbers[d] !== undefined)
      .sort((a, b) => dayNumbers[a] - dayNumbers[b]);

    if (availableDays.length === 0 || config.timeSlots.length === 0) {
      return {
        sessions: [],
        summary: { totalWeeks: 0, totalSessions: 0, totalLessons: 0, finishDate: '' }
      };
    }

    // Crear un iterador de slots (día + hora)
    let currentDate = new Date(config.startDate);
    let groupIndex = 0;
    const weeksUsed = new Set<number>();

    while (groupIndex < groupedLessons.length) {
      // Buscar el próximo día válido
      const currentDayName = this.getDayName(currentDate);
      const normalizedDayName = currentDayName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (availableDays.some(d =>
        d.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedDayName
      )) {
        // Este día es válido, asignar sesiones para cada slot de tiempo
        for (const timeSlot of config.timeSlots) {
          if (groupIndex >= groupedLessons.length) break;

          const group = groupedLessons[groupIndex];
          const startTime = slotTimes[timeSlot.toLowerCase()] || '08:00';
          const totalMinutes = group.reduce((sum, l) => sum + l.durationMinutes, 0);
          const endTime = this.addMinutesToTime(startTime, totalMinutes);

          // Calcular número de semana
          const weekNum = this.getWeekNumber(config.startDate, currentDate);
          weeksUsed.add(weekNum);

          sessions.push({
            weekNumber: weekNum,
            dayName: currentDayName,
            date: this.formatDateForDisplay(currentDate),
            timeSlot: timeSlot.toLowerCase(),
            startTime,
            endTime,
            totalMinutes,
            lessons: group.map(l => ({
              title: l.lessonTitle,
              duration: l.durationMinutes
            }))
          });

          groupIndex++;
        }
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);

      // Verificar si hemos pasado la fecha límite
      if (config.targetDate && currentDate > config.targetDate) {
        break;
      }

      // Protección contra bucles infinitos (máximo 1 año)
      if (currentDate.getTime() - config.startDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
        break;
      }
    }

    const finishDate = sessions.length > 0
      ? sessions[sessions.length - 1].date
      : this.formatDateForDisplay(config.startDate);

    return {
      sessions,
      summary: {
        totalWeeks: weeksUsed.size,
        totalSessions: sessions.length,
        totalLessons: lessons.length,
        finishDate
      }
    };
  }

  /**
   * Agrupa lecciones que comparten el mismo número base (ej: 1 y 1.1 juntas)
   */
  private static groupDecimalLessons(
    lessons: Array<{
      lessonTitle: string;
      lessonOrderIndex: number;
      moduleTitle: string;
      durationMinutes: number;
    }>
  ): Array<Array<{
    lessonTitle: string;
    lessonOrderIndex: number;
    moduleTitle: string;
    durationMinutes: number;
  }>> {
    const groups: Array<Array<typeof lessons[0]>> = [];
    let currentGroup: Array<typeof lessons[0]> = [];
    let currentBase: number | null = null;

    for (const lesson of lessons) {
      // Extraer el número base (parte entera del índice)
      const index = lesson.lessonOrderIndex;
      const base = Math.floor(index);
      const isDecimal = index !== base; // ej: 1.1 es decimal, 1 no lo es

      if (currentBase === null) {
        // Primera lección
        currentBase = base;
        currentGroup.push(lesson);
      } else if (base === currentBase && isDecimal) {
        // Es una versión decimal de la lección actual (ej: 1 -> 1.1)
        currentGroup.push(lesson);
      } else if (base === currentBase && !isDecimal && currentGroup.length === 0) {
        // Es una lección sin decimal, agregar al grupo
        currentGroup.push(lesson);
      } else {
        // Nueva lección base, guardar grupo anterior
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [lesson];
        currentBase = base;
      }
    }

    // No olvidar el último grupo
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Suma minutos a una hora en formato HH:MM
   */
  private static addMinutesToTime(startTime: string, minutes: number): string {
    const [hours, mins] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  /**
   * Obtiene el nombre del día en español
   */
  private static getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  /**
   * Calcula el número de semana desde la fecha de inicio
   */
  private static getWeekNumber(startDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  }

  /**
   * Formatea una fecha para mostrar (DD de mes)
   */
  private static formatDateForDisplay(date: Date): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${date.getDate()} de ${months[date.getMonth()]}`;
  }
}
