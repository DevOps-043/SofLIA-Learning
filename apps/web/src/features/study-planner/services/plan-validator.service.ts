export interface ExtensionRequirement {
  isFeasible: boolean;
  reason?: string;
  minutesRequired: number;
  minutesAvailable: number;
  minutesMissing: number;
  daysNeeded: number;
  weeksNeeded: number;
  suggestedNewDeadline?: Date;
  feasibilityScore: number; // 0-100%
  holidaysExcluded?: number;
}

export interface PlanValidationConfig {
  totalLessons: number;
  availableSlots: number;
  targetDate: Date;
  userType: 'b2b' | 'b2c';
  sessionDurationMinutes?: number;
  averageLessonDurationMinutes?: number;
}

export class PlanValidatorService {
  static validatePlanFeasibility(config: PlanValidationConfig): ExtensionRequirement {
    const {
      totalLessons,
      availableSlots,
      targetDate,
      userType,
      sessionDurationMinutes = 45, // Default: sesión normal
      averageLessonDurationMinutes = 30, // Default: 30 min por lección
    } = config;

    const minutesRequired = totalLessons * averageLessonDurationMinutes;

    const minutesAvailable = availableSlots * sessionDurationMinutes;

    const minutesMissing = Math.max(0, minutesRequired - minutesAvailable);

    const isFeasible = minutesMissing === 0;

    let daysNeeded = 0;
    let weeksNeeded = 0;
    let suggestedNewDeadline: Date | undefined;

    if (!isFeasible) {
      daysNeeded = Math.ceil(minutesMissing / sessionDurationMinutes);

      weeksNeeded = Math.ceil(daysNeeded / 7);

      suggestedNewDeadline = new Date(targetDate);
      suggestedNewDeadline.setDate(targetDate.getDate() + (weeksNeeded * 7));
    }

    const feasibilityScore = minutesRequired > 0
      ? Math.min(100, (minutesAvailable / minutesRequired) * 100)
      : 100;

    let reason: string | undefined;
    if (!isFeasible) {
      if (userType === 'b2b') {
        reason = `Plan no factible para usuario B2B: Se requieren ${Math.round(minutesRequired / 60)} horas de estudio, pero solo hay ${Math.round(minutesAvailable / 60)} horas disponibles antes de la fecha límite impuesta por el administrador.`;
      } else {
        reason = `Plan no factible: Se requieren ${Math.round(minutesRequired / 60)} horas de estudio, pero solo hay ${Math.round(minutesAvailable / 60)} horas disponibles antes de la fecha límite seleccionada.`;
      }
    }

    return {
      isFeasible,
      reason,
      minutesRequired,
      minutesAvailable,
      minutesMissing,
      daysNeeded,
      weeksNeeded,
      suggestedNewDeadline,
      feasibilityScore,
    };
  }

  /**
   * Valida factibilidad considerando múltiples cursos
   *
   * @param courses - Array de cursos con sus lecciones pendientes
   * @param availableSlots - Número de slots disponibles
   * @param targetDate - Fecha límite
   * @param userType - Tipo de usuario
   * @param sessionDurationMinutes - Duración de cada sesión
   * @returns Resultado de validación
   */
  static validateMultiCoursePlan(
    courses: Array<{
      courseId: string;
      courseTitle: string;
      lessonsCount: number;
      averageLessonDuration?: number;
    }>,
    availableSlots: number,
    targetDate: Date,
    userType: 'b2b' | 'b2c',
    sessionDurationMinutes: number = 45
  ): ExtensionRequirement {
    // Calcular total de lecciones
    const totalLessons = courses.reduce((sum, course) => sum + course.lessonsCount, 0);

    // Calcular duración promedio ponderada de lecciones
    const totalDuration = courses.reduce(
      (sum, course) => sum + (course.lessonsCount * (course.averageLessonDuration || 30)),
      0
    );
    const averageLessonDurationMinutes = totalLessons > 0 ? totalDuration / totalLessons : 30;

    return this.validatePlanFeasibility({
      totalLessons,
      availableSlots,
      targetDate,
      userType,
      sessionDurationMinutes,
      averageLessonDurationMinutes,
    });
  }

  /**
   * Formatea el resultado de validación para mostrar a LIA
   *
   * @param validation - Resultado de validación
   * @param targetDate - Fecha límite
   * @param holidaysExcluded - Número de festivos excluidos
   * @returns Mensaje formateado para LIA
   */
  static formatValidationForLIA(
    validation: ExtensionRequirement,
    targetDate: Date,
    holidaysExcluded: number = 0
  ): string {
    if (validation.isFeasible) {
      return `✅ PLAN FACTIBLE: El plan es viable con los horarios disponibles hasta ${targetDate.toLocaleDateString('es-ES')}. Factibilidad: ${Math.round(validation.feasibilityScore)}%`;
    }

    const hoursRequired = Math.round(validation.minutesRequired / 60 * 10) / 10;
    const hoursAvailable = Math.round(validation.minutesAvailable / 60 * 10) / 10;
    const hoursDeficit = Math.round(validation.minutesMissing / 60 * 10) / 10;

    let message = `⚠️ PLAN NO FACTIBLE:\n\n`;
    message += `ANÁLISIS DE FACTIBILIDAD:\n`;
    message += `- Horas de estudio requeridas: ${hoursRequired} horas\n`;
    message += `- Horas disponibles hasta ${targetDate.toLocaleDateString('es-ES')}: ${hoursAvailable} horas\n`;
    message += `- Déficit: ${hoursDeficit} horas (${validation.daysNeeded} días de estudio adicionales)\n`;

    if (holidaysExcluded > 0) {
      message += `- Días festivos excluidos del análisis: ${holidaysExcluded}\n`;
    }

    message += `\nRECOMENDACIÓN:\n`;
    message += `Extender la fecha límite ${validation.weeksNeeded} semana${validation.weeksNeeded > 1 ? 's' : ''} `;
    message += `hasta el ${validation.suggestedNewDeadline?.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}.\n`;

    return message;
  }

  /**
   * Calcula el número de lecciones que se pueden completar con los slots disponibles
   *
   * @param availableSlots - Número de slots disponibles
   * @param sessionDurationMinutes - Duración de cada sesión
   * @param averageLessonDurationMinutes - Duración promedio de cada lección
   * @returns Número de lecciones que se pueden completar
   */
  static calculateMaxLessons(
    availableSlots: number,
    sessionDurationMinutes: number,
    averageLessonDurationMinutes: number = 30
  ): number {
    const totalMinutesAvailable = availableSlots * sessionDurationMinutes;
    return Math.floor(totalMinutesAvailable / averageLessonDurationMinutes);
  }

  /**
   * Sugiere cursos a eliminar si el plan no es factible
   *
   * @param courses - Array de cursos
   * @param maxLessons - Máximo de lecciones que se pueden completar
   * @returns Array de IDs de cursos sugeridos para eliminar
   */
  static suggestCoursesToRemove(
    courses: Array<{
      courseId: string;
      courseTitle: string;
      lessonsCount: number;
      priority?: number; // Menor número = mayor prioridad
    }>,
    maxLessons: number
  ): string[] {
    // Ordenar cursos por prioridad (si existe) o por número de lecciones (más pequeños primero)
    const sortedCourses = [...courses].sort((a, b) => {
      if (a.priority !== undefined && b.priority !== undefined) {
        return b.priority - a.priority; // Menor prioridad primero
      }
      return a.lessonsCount - b.lessonsCount; // Cursos más pequeños primero
    });

    const coursesToRemove: string[] = [];
    let lessonsAccumulated = 0;

    for (const course of sortedCourses) {
      if (lessonsAccumulated + course.lessonsCount <= maxLessons) {
        lessonsAccumulated += course.lessonsCount;
      } else {
        coursesToRemove.push(course.courseId);
      }
    }

    return coursesToRemove;
  }

  /**
   * Calcula la intensidad diaria necesaria para cumplir con la fecha límite
   *
   * @param totalLessons - Total de lecciones pendientes
   * @param daysAvailable - Días disponibles hasta la fecha límite
   * @param averageLessonDurationMinutes - Duración promedio de lección
   * @returns Minutos de estudio necesarios por día
   */
  static calculateRequiredDailyIntensity(
    totalLessons: number,
    daysAvailable: number,
    averageLessonDurationMinutes: number = 30
  ): number {
    if (daysAvailable === 0) return Infinity;
    const totalMinutesRequired = totalLessons * averageLessonDurationMinutes;
    return Math.ceil(totalMinutesRequired / daysAvailable);
  }
}
