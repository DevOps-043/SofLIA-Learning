import { LessonTimeService } from './lesson-time.service';
import { SessionValidatorService } from './session-validator.service';
import type {
  CourseLesson,
  GeneratedSession,
  SessionConfig,
  SessionGenerationResult,
} from './session-generator.types';
import {
  calculateSessionStats,
  groupSessionsByWeek,
} from './session-generator-stats.service';

export type {
  CourseLesson,
  GeneratedSession,
  SessionConfig,
  SessionGenerationResult,
  TimeBlockConfig,
} from './session-generator.types';

export class SessionGeneratorService {
  private static readonly DAYS_ORDER = [
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
  ];

  /**
   * Genera sesiones de estudio distribuidas
   */
  static async generateSessions(
    config: SessionConfig,
    courseIds: string[]
  ): Promise<SessionGenerationResult> {
    const warnings: string[] = [];
    const sessions: GeneratedSession[] = [];

    // Obtener lecciones de todos los cursos
    const allLessons = await this.getAllLessons(courseIds);

    if (allLessons.length === 0) {
      return {
        sessions: [],
        totalSessions: 0,
        totalStudyMinutes: 0,
        totalBreakMinutes: 0,
        estimatedEndDate: config.startDate,
        warnings: ['No se encontraron lecciones en los cursos seleccionados.']
      };
    }

    // Ordenar días según preferencia
    const sortedDays = this.sortDays(config.selectedDays);

    // Generar sesiones
    let currentDate = new Date(config.startDate);
    let lessonIndex = 0;
    let sessionOrder = 1;
    const maxIterations = 365; // Máximo 1 año
    let iterations = 0;

    while (lessonIndex < allLessons.length && iterations < maxIterations) {
      const dayName = this.getDayName(currentDate.getDay());

      if (sortedDays.includes(dayName)) {
        const timeBlock = config.timeBlocks.find(tb => tb.day === dayName);

        if (timeBlock && lessonIndex < allLessons.length) {
          const lesson = allLessons[lessonIndex];

          // Usar duración base de la lección (sin multiplicadores)
          const sessionDuration = this.calculateSessionDuration(
            lesson.durationMinutes,
            config.minSessionMinutes,
            config.maxSessionMinutes
          );

          // Calcular descansos
          const breaks = SessionValidatorService.calculateBreakSchedule(sessionDuration);
          const totalBreakTime = breaks.reduce((sum, b) => sum + b.breakDurationMinutes, 0);

          // Crear sesión
          sessions.push({
            id: `session-${sessionOrder}`,
            date: new Date(currentDate),
            dayOfWeek: dayName,
            startTime: this.formatTime(timeBlock.startHour, timeBlock.startMinute),
            endTime: this.calculateEndTime(
              timeBlock.startHour,
              timeBlock.startMinute,
              sessionDuration + totalBreakTime
            ),
            durationMinutes: sessionDuration + totalBreakTime,
            netStudyMinutes: sessionDuration,
            courseId: lesson.courseId,
            courseTitle: lesson.courseTitle,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.lessonTitle,
            breaks,
            order: sessionOrder
          });

          lessonIndex++;
          sessionOrder++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;

      // Verificar fecha límite
      if (config.endDate && currentDate > config.endDate) {
        if (lessonIndex < allLessons.length) {
          warnings.push(
            `No fue posible programar todas las lecciones antes de la fecha límite. ` +
            `Quedan ${allLessons.length - lessonIndex} lecciones pendientes.`
          );
        }
        break;
      }
    }

    // Calcular totales
    const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.netStudyMinutes, 0);
    const totalBreakMinutes = sessions.reduce((sum, s) =>
      sum + s.breaks.reduce((bSum, b) => bSum + b.breakDurationMinutes, 0), 0
    );

    return {
      sessions,
      totalSessions: sessions.length,
      totalStudyMinutes,
      totalBreakMinutes,
      estimatedEndDate: sessions.length > 0
        ? sessions[sessions.length - 1].date
        : config.startDate,
      warnings
    };
  }

  /**
   * Obtiene todas las lecciones de los cursos ordenadas
   */
  private static async getAllLessons(courseIds: string[]): Promise<CourseLesson[]> {
    const lessons: CourseLesson[] = [];

    for (const courseId of courseIds) {
      const courseTime = await LessonTimeService.getCourseTimeEstimate(courseId);

      if (courseTime) {
        for (const lesson of courseTime.lessons) {
          lessons.push({
            courseId: courseTime.courseId,
            courseTitle: courseTime.courseTitle,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.lessonTitle,
            durationMinutes: lesson.totalMinutes
          });
        }
      }
    }

    return lessons;
  }

  /**
   * Calcula la duración de la sesión usando la duración base de la lección
   */
  private static calculateSessionDuration(
    lessonMinutes: number,
    minSession: number,
    maxSession: number
  ): number {
    // Usar la duración base de la lección
    const sessionDuration = Math.ceil(lessonMinutes);

    // La sesión debe cubrir al menos el mínimo configurado
    const requiredMinutes = Math.max(sessionDuration, minSession);

    // Pero no exceder el máximo
    return Math.min(requiredMinutes, maxSession);
  }

  /**
   * Ordena los días según el orden natural de la semana
   */
  private static sortDays(days: string[]): string[] {
    return days.sort((a, b) => {
      const indexA = this.DAYS_ORDER.indexOf(a.toLowerCase());
      const indexB = this.DAYS_ORDER.indexOf(b.toLowerCase());
      return indexA - indexB;
    });
  }

  /**
   * Obtiene el nombre del día
   */
  private static getDayName(dayIndex: number): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[dayIndex];
  }

  /**
   * Formatea hora
   */
  private static formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula hora de fin
   */
  private static calculateEndTime(
    startHour: number,
    startMinute: number,
    durationMinutes: number
  ): string {
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return this.formatTime(endHour, endMinute);
  }

  /**
   * Agrupa sesiones por semana
   */
  static groupSessionsByWeek(sessions: GeneratedSession[]): Map<string, GeneratedSession[]> {
    return groupSessionsByWeek(sessions);
  }

  /**
   * Calcula estadísticas de las sesiones
   */
  static calculateSessionStats(sessions: GeneratedSession[]): {
    avgSessionMinutes: number;
    avgBreakMinutes: number;
    sessionsPerWeek: number;
    studyHoursPerWeek: number;
  } {
    return calculateSessionStats(sessions);
  }
}
