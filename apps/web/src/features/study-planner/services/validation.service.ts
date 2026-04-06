/**
 * ValidationService
 * 
 * Servicio para validar configuraciones del planificador de estudios
 * incluyendo tiempos de sesión, conflictos de calendario y plazos B2B.
 */

import type {
  TimeBlock,
  CalendarEvent,
  StudySession,
  LessonDuration,
} from '../types/user-context.types';
import type { OrganizationPlannerConfig } from './organization-planner-config.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DeadlineValidation {
  courseId: string;
  courseTitle: string;
  dueDate: string;
  estimatedCompletionDate: string;
  canComplete: boolean;
  daysOverdue?: number;
  suggestedAction?: string;
}

export class ValidationService {
  /**
   * Valida que el tiempo mínimo de sesión permita completar al menos una lección
   */
  static validateMinimumSessionTime(
    sessionMinutes: number,
    lessonDurations: LessonDuration[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (lessonDurations.length === 0) {
      return {
        isValid: true,
        errors,
        warnings: ['No hay lecciones para validar'],
        suggestions,
      };
    }
    
    // Encontrar la lección más corta
    const minLessonTime = Math.min(...lessonDurations.map(l => l.totalMinutes));
    
    if (sessionMinutes < minLessonTime) {
      errors.push(
        `El tiempo mínimo de sesión (${sessionMinutes} min) es menor que la lección más corta (${Math.ceil(minLessonTime)} min).`
      );
      suggestions.push(
        `Aumenta el tiempo mínimo de sesión a al menos ${Math.ceil(minLessonTime)} minutos para poder completar al menos una lección por sesión.`
      );
    }
    
    // Advertir si el tiempo es muy ajustado
    if (sessionMinutes < minLessonTime * 1.2 && sessionMinutes >= minLessonTime) {
      warnings.push(
        `El tiempo mínimo de sesión está muy ajustado. Considera aumentarlo para tener margen.`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Valida que no haya conflictos con eventos del calendario
   */
  static validateCalendarConflicts(
    sessions: Array<{ startTime: string; endTime: string; title?: string }>,
    calendarEvents: CalendarEvent[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    for (const session of sessions) {
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);
      
      for (const event of calendarEvents) {
        if (event.status === 'cancelled') continue;
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Verificar solapamiento
        if (sessionStart < eventEnd && sessionEnd > eventStart) {
          const sessionTitle = session.title || 'Sesión de estudio';
          
          if (event.status === 'confirmed') {
            errors.push(
              `"${sessionTitle}" se solapa con "${event.title}" (${eventStart.toLocaleString()}).`
            );
          } else {
            warnings.push(
              `"${sessionTitle}" podría solaparse con "${event.title}" (evento tentativo).`
            );
          }
        }
      }
    }
    
    if (errors.length > 0) {
      suggestions.push('Ajusta los horarios de las sesiones para evitar conflictos con tus eventos existentes.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Valida que los plazos B2B se puedan cumplir
   */
  static validateB2BDeadlines(
    courses: Array<{
      courseId: string;
      courseTitle: string;
      dueDate?: string;
      remainingMinutes: number;
    }>,
    weeklyStudyMinutes: number,
    startDate: Date = new Date()
  ): ValidationResult & { deadlineIssues: DeadlineValidation[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const deadlineIssues: DeadlineValidation[] = [];
    
    if (weeklyStudyMinutes <= 0) {
      return {
        isValid: false,
        errors: ['El tiempo de estudio semanal debe ser mayor a 0'],
        warnings,
        suggestions,
        deadlineIssues,
      };
    }
    
    let accumulatedMinutes = 0;
    
    for (const course of courses) {
      if (!course.dueDate) continue;
      
      const dueDate = new Date(course.dueDate);
      accumulatedMinutes += course.remainingMinutes;
      
      // Calcular semanas necesarias para completar hasta este curso
      const weeksNeeded = accumulatedMinutes / weeklyStudyMinutes;
      const estimatedCompletionDate = new Date(startDate);
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(weeksNeeded * 7));
      
      const canComplete = estimatedCompletionDate <= dueDate;
      
      const validation: DeadlineValidation = {
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        dueDate: course.dueDate,
        estimatedCompletionDate: estimatedCompletionDate.toISOString(),
        canComplete,
      };
      
      if (!canComplete) {
        const daysOverdue = Math.ceil(
          (estimatedCompletionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        validation.daysOverdue = daysOverdue;
        validation.suggestedAction = this.suggestDeadlineAction(
          course.remainingMinutes,
          daysOverdue,
          weeklyStudyMinutes
        );
        
        errors.push(
          `"${course.courseTitle}" no se completará antes del plazo (${daysOverdue} días de retraso estimado).`
        );
      } else {
        // Advertir si está muy ajustado (menos de 3 días de margen)
        const marginDays = Math.ceil(
          (dueDate.getTime() - estimatedCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (marginDays < 3) {
          warnings.push(
            `"${course.courseTitle}" se completará con poco margen (${marginDays} día(s) antes del plazo).`
          );
        }
      }
      
      deadlineIssues.push(validation);
    }
    
    if (errors.length > 0) {
      suggestions.push(
        'Considera aumentar las horas de estudio semanales o comenzar antes para cumplir con los plazos.'
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      deadlineIssues,
    };
  }

  /**
   * Sugiere acción para cumplir con un plazo
   */
  private static suggestDeadlineAction(
    remainingMinutes: number,
    daysOverdue: number,
    currentWeeklyMinutes: number
  ): string {
    // Calcular minutos adicionales necesarios por semana
    const additionalWeeklyMinutes = Math.ceil(
      (remainingMinutes / Math.max(daysOverdue / 7, 1)) - currentWeeklyMinutes
    );
    
    if (additionalWeeklyMinutes <= 60) {
      return `Aumenta tu tiempo de estudio en ${additionalWeeklyMinutes} minutos por semana.`;
    } else if (additionalWeeklyMinutes <= 180) {
      return `Dedica ${Math.round(additionalWeeklyMinutes / 60)} horas adicionales por semana a este curso.`;
    } else {
      return 'Contacta a tu administrador para solicitar una extensión del plazo.';
    }
  }

  /**
   * Valida que los tiempos de sesión sean razonables
   */
  static validateSessionTimes(
    minMinutes: number,
    maxMinutes: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Validaciones básicas
    if (minMinutes <= 0) {
      errors.push('El tiempo mínimo de sesión debe ser mayor a 0.');
    }
    
    if (maxMinutes <= 0) {
      errors.push('El tiempo máximo de sesión debe ser mayor a 0.');
    }
    
    if (minMinutes >= maxMinutes) {
      errors.push('El tiempo máximo debe ser mayor que el tiempo mínimo.');
    }
    
    // Advertencias sobre tiempos
    if (minMinutes < 15) {
      warnings.push('Sesiones de menos de 15 minutos pueden no ser efectivas para el aprendizaje.');
      suggestions.push('Considera aumentar el tiempo mínimo a al menos 15 minutos.');
    }
    
    if (maxMinutes > 120) {
      warnings.push('Sesiones de más de 2 horas pueden afectar la concentración.');
      suggestions.push('Considera dividir las sesiones largas con descansos frecuentes.');
    }
    
    if (maxMinutes > 180) {
      warnings.push('Las sesiones de más de 3 horas no son recomendables para la retención.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Valida los tiempos de descanso
   */
  static validateBreakTimes(
    sessionDuration: number,
    breakDuration: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (breakDuration < 0) {
      errors.push('El tiempo de descanso no puede ser negativo.');
    }
    
    if (breakDuration === 0) {
      warnings.push('No se han configurado descansos. Los descansos son importantes para la retención.');
      suggestions.push('Considera agregar al menos 5 minutos de descanso entre sesiones.');
    }
    
    // Recomendaciones basadas en duración de sesión
    if (sessionDuration <= 25) {
      // Técnica Pomodoro
      if (breakDuration > 10) {
        warnings.push('Para sesiones cortas (25 min), los descansos de 5-10 minutos son óptimos.');
      }
    } else if (sessionDuration <= 45) {
      if (breakDuration < 5) {
        warnings.push('Para sesiones de 45 minutos, se recomiendan descansos de al menos 10 minutos.');
      }
    } else if (sessionDuration <= 90) {
      if (breakDuration < 10) {
        warnings.push('Para sesiones largas (60-90 min), se recomiendan descansos de 15-20 minutos.');
        suggestions.push('Considera incluir una actividad física ligera durante el descanso.');
      }
    } else {
      if (breakDuration < 15) {
        warnings.push('Para sesiones muy largas (>90 min), los descansos deben ser de al menos 15-20 minutos.');
        suggestions.push('Considera dividir la sesión en bloques más pequeños con descansos intermedios.');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Valida los días y horarios configurados
   */
  static validateDaysAndHours(
    preferredDays: number[],
    timeBlocks: TimeBlock[],
    minSessionMinutes: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Validar días
    if (!preferredDays || preferredDays.length === 0) {
      errors.push('Debes seleccionar al menos un día para estudiar.');
    }
    
    // Validar bloques de tiempo
    if (!timeBlocks || timeBlocks.length === 0) {
      errors.push('Debes configurar al menos un bloque de tiempo para estudiar.');
    }
    
    // Validar cada bloque de tiempo
    for (let i = 0; i < (timeBlocks || []).length; i++) {
      const block = timeBlocks[i];
      
      // Validar formato
      if (block.startHour < 0 || block.startHour > 23 ||
          block.endHour < 0 || block.endHour > 23 ||
          block.startMinute < 0 || block.startMinute > 59 ||
          block.endMinute < 0 || block.endMinute > 59) {
        errors.push(`El bloque de tiempo ${i + 1} tiene valores inválidos.`);
        continue;
      }
      
      // Calcular duración del bloque
      const startMinutes = block.startHour * 60 + block.startMinute;
      const endMinutes = block.endHour * 60 + block.endMinute;
      const blockDuration = endMinutes - startMinutes;
      
      if (blockDuration <= 0) {
        errors.push(
          `El bloque de tiempo ${i + 1} (${block.startHour}:${String(block.startMinute).padStart(2, '0')} - ` +
          `${block.endHour}:${String(block.endMinute).padStart(2, '0')}) tiene duración inválida.`
        );
      } else if (blockDuration < minSessionMinutes) {
        warnings.push(
          `El bloque de tiempo ${i + 1} (${blockDuration} min) es menor que el tiempo mínimo de sesión (${minSessionMinutes} min).`
        );
      }
      
      // Verificar solapamiento con otros bloques
      for (let j = i + 1; j < (timeBlocks || []).length; j++) {
        const otherBlock = timeBlocks[j];
        const otherStart = otherBlock.startHour * 60 + otherBlock.startMinute;
        const otherEnd = otherBlock.endHour * 60 + otherBlock.endMinute;
        
        if (startMinutes < otherEnd && endMinutes > otherStart) {
          warnings.push(
            `Los bloques de tiempo ${i + 1} y ${j + 1} se solapan.`
          );
        }
      }
    }
    
    // Advertencias adicionales
    if ((preferredDays || []).length < 3) {
      warnings.push('Estudiar menos de 3 días por semana puede dificultar la retención.');
      suggestions.push('Considera distribuir tu estudio en más días con sesiones más cortas.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Ejecuta todas las validaciones
   */
  static validateAll(params: {
    minSessionMinutes: number;
    maxSessionMinutes: number;
    breakDurationMinutes: number;
    preferredDays: number[];
    timeBlocks: TimeBlock[];
    lessonDurations?: LessonDuration[];
    calendarEvents?: CalendarEvent[];
    sessions?: Array<{ startTime: string; endTime: string; title?: string }>;
    b2bCourses?: Array<{
      courseId: string;
      courseTitle: string;
      dueDate?: string;
      remainingMinutes: number;
    }>;
    weeklyStudyMinutes?: number;
  }): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allSuggestions: string[] = [];
    
    // Validar tiempos de sesión
    const sessionValidation = this.validateSessionTimes(
      params.minSessionMinutes,
      params.maxSessionMinutes
    );
    allErrors.push(...sessionValidation.errors);
    allWarnings.push(...sessionValidation.warnings);
    allSuggestions.push(...sessionValidation.suggestions);
    
    // Validar tiempo mínimo contra lecciones
    if (params.lessonDurations && params.lessonDurations.length > 0) {
      const lessonValidation = this.validateMinimumSessionTime(
        params.minSessionMinutes,
        params.lessonDurations
      );
      allErrors.push(...lessonValidation.errors);
      allWarnings.push(...lessonValidation.warnings);
      allSuggestions.push(...lessonValidation.suggestions);
    }
    
    // Validar descansos
    const breakValidation = this.validateBreakTimes(
      params.maxSessionMinutes,
      params.breakDurationMinutes
    );
    allErrors.push(...breakValidation.errors);
    allWarnings.push(...breakValidation.warnings);
    allSuggestions.push(...breakValidation.suggestions);
    
    // Validar días y horarios
    const scheduleValidation = this.validateDaysAndHours(
      params.preferredDays,
      params.timeBlocks,
      params.minSessionMinutes
    );
    allErrors.push(...scheduleValidation.errors);
    allWarnings.push(...scheduleValidation.warnings);
    allSuggestions.push(...scheduleValidation.suggestions);
    
    // Validar conflictos con calendario
    if (params.calendarEvents && params.sessions) {
      const calendarValidation = this.validateCalendarConflicts(
        params.sessions,
        params.calendarEvents
      );
      allErrors.push(...calendarValidation.errors);
      allWarnings.push(...calendarValidation.warnings);
      allSuggestions.push(...calendarValidation.suggestions);
    }
    
    // Validar plazos B2B
    if (params.b2bCourses && params.weeklyStudyMinutes) {
      const deadlineValidation = this.validateB2BDeadlines(
        params.b2bCourses,
        params.weeklyStudyMinutes
      );
      allErrors.push(...deadlineValidation.errors);
      allWarnings.push(...deadlineValidation.warnings);
      allSuggestions.push(...deadlineValidation.suggestions);
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: [...new Set(allErrors)], // Eliminar duplicados
      warnings: [...new Set(allWarnings)],
      suggestions: [...new Set(allSuggestions)],
    };
  }
  /**
   * Validates study sessions against the organizational planner config.
   * Generates warnings (not errors) when sessions fall outside work hours,
   * because the org config is a SUGGESTION, not a hard block (RC-07, RN-02).
   */
  static validateAgainstOrgConfig(
    sessions: Array<{ date: Date; startHour: number; endHour: number }>,
    orgConfig: OrganizationPlannerConfig,
  ): ValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const workStartHour = parseInt(orgConfig.workStartTime.split(':')[0], 10);
    const workEndHour = parseInt(orgConfig.workEndTime.split(':')[0], 10);

    let outsideWorkHoursCount = 0;
    let nonWorkDayCount = 0;

    for (const session of sessions) {
      const dayOfWeek = session.date.getDay();

      // Check if the session is on a non-work day
      if (!orgConfig.workDays.includes(dayOfWeek)) {
        nonWorkDayCount++;
      }

      // Check if the session is outside work hours
      if (session.startHour < workStartHour || session.endHour > workEndHour) {
        outsideWorkHoursCount++;
      }
    }

    if (outsideWorkHoursCount > 0) {
      warnings.push(
        `${outsideWorkHoursCount} sesion(es) estan fuera del horario laboral de tu organizacion (${orgConfig.workStartTime} - ${orgConfig.workEndTime}). Puedes estudiar cuando prefieras, pero dentro del horario laboral es lo recomendado.`,
      );
    }

    if (nonWorkDayCount > 0) {
      warnings.push(
        `${nonWorkDayCount} sesion(es) caen en dias fuera de la jornada laboral configurada. Puedes mantenerlas si lo deseas.`,
      );
    }

    if (outsideWorkHoursCount > 0 || nonWorkDayCount > 0) {
      suggestions.push(
        'Tu organizacion sugiere estudiar dentro del horario laboral. Considera mover las sesiones para mayor comodidad.',
      );
    }

    return {
      isValid: true, // Always valid — org config is advisory, not blocking
      errors: [],
      warnings,
      suggestions,
    };
  }

  /**
   * Validates that a study plan's dates fall within the course assignment's
   * planning window. Returns errors if sessions are completely outside,
   * warnings if partially outside.
   */
  static validatePlanningWindow(
    sessionDates: Date[],
    planningWindow: { start?: Date | null; end?: Date | null },
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!planningWindow.start && !planningWindow.end) {
      return { isValid: true, errors, warnings, suggestions };
    }

    let beforeWindowCount = 0;
    let afterWindowCount = 0;

    for (const sessionDate of sessionDates) {
      const dateOnly = new Date(sessionDate);
      dateOnly.setHours(0, 0, 0, 0);

      if (planningWindow.start) {
        const winStart = new Date(planningWindow.start);
        winStart.setHours(0, 0, 0, 0);
        if (dateOnly < winStart) {
          beforeWindowCount++;
        }
      }

      if (planningWindow.end) {
        const winEnd = new Date(planningWindow.end);
        winEnd.setHours(23, 59, 59, 999);
        if (dateOnly > winEnd) {
          afterWindowCount++;
        }
      }
    }

    if (beforeWindowCount > 0) {
      warnings.push(
        `${beforeWindowCount} sesion(es) estan programadas antes del inicio de la ventana de planificacion.`,
      );
    }

    if (afterWindowCount > 0) {
      errors.push(
        `${afterWindowCount} sesion(es) estan programadas despues del cierre de la ventana de planificacion. Deben reprogramarse.`,
      );
    }

    if (beforeWindowCount > 0 || afterWindowCount > 0) {
      suggestions.push(
        'Ajusta las fechas de tus sesiones para que caigan dentro de la ventana administrativa asignada por tu organizacion.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}
