/**
 * API Endpoint: Validate Session Times
 * 
 * POST /api/study-planner/validate-session-times
 * 
 * Valida que los tiempos de sesión propuestos cumplan con las reglas:
 * - Tiempo mínimo >= duración de lección completa
 * - Tiempos respetan disponibilidad del calendario
 * - Para B2B: tiempos permiten completar cursos antes de due_date
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type { CalendarEvent } from '../../../../features/study-planner/types/user-context.types';

interface ValidateSessionTimesRequest {
  courseIds: string[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredDays: number[];
  preferredTimeBlocks: Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>;
  calendarEvents?: CalendarEvent[];
  goalHoursPerWeek?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  minimumLessonTime: number;
  totalEstimatedMinutes: number;
  estimatedWeeksToComplete: number;
  meetsDeadlines: boolean;
  deadlineIssues?: Array<{
    courseId: string;
    courseTitle: string;
    dueDate: string;
    estimatedCompletionDate: string;
    daysOverdue: number;
  }>;
}

interface ValidateSessionTimesResponse {
  success: boolean;
  data?: ValidationResult;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidateSessionTimesResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: ValidateSessionTimesRequest = await request.json();
    
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Calcular tiempo mínimo de lección y tiempo restante en paralelo para todos los cursos
    const courseAnalysisResults = await Promise.all(
      body.courseIds.map(async (courseId) => {
        const [minTime, remaining] = await Promise.all([
          CourseAnalysisService.getMinimumLessonTime(courseId),
          CourseAnalysisService.calculateRemainingTime(user.id, courseId),
        ]);
        return { courseId, minTime, remainingMinutes: remaining.totalRemainingMinutes };
      })
    );

    let minimumLessonTime = Infinity;
    let totalEstimatedMinutes = 0;
    for (const result of courseAnalysisResults) {
      if (result.minTime < minimumLessonTime) {
        minimumLessonTime = result.minTime;
      }
      totalEstimatedMinutes += result.remainingMinutes;
    }

    if (minimumLessonTime === Infinity) {
      minimumLessonTime = 15; // Default mínimo
    }
    
    // VALIDACIÓN 1: Tiempo mínimo de sesión >= duración de lección
    if (body.minSessionMinutes < minimumLessonTime) {
      errors.push(
        `El tiempo mínimo de sesión (${body.minSessionMinutes} min) es menor que la lección más corta (${Math.ceil(minimumLessonTime)} min). ` +
        `Es importante completar al menos una lección por sesión.`
      );
      suggestions.push(`Aumenta el tiempo mínimo de sesión a al menos ${Math.ceil(minimumLessonTime)} minutos.`);
    }
    
    // VALIDACIÓN 2: Tiempo máximo > tiempo mínimo
    if (body.maxSessionMinutes <= body.minSessionMinutes) {
      errors.push('El tiempo máximo de sesión debe ser mayor que el tiempo mínimo.');
    }
    
    // VALIDACIÓN 3: Tiempos razonables
    if (body.maxSessionMinutes > 180) {
      warnings.push('Las sesiones de más de 3 horas pueden afectar la concentración y retención.');
      suggestions.push('Considera dividir las sesiones largas con descansos más frecuentes.');
    }
    
    if (body.breakDurationMinutes < 5) {
      warnings.push('Los descansos muy cortos (menos de 5 minutos) pueden no ser suficientes para recuperar la concentración.');
    }
    
    // VALIDACIÓN 4: Días y horarios válidos
    if (!body.preferredDays || body.preferredDays.length === 0) {
      errors.push('Debes seleccionar al menos un día para estudiar.');
    }
    
    if (!body.preferredTimeBlocks || body.preferredTimeBlocks.length === 0) {
      errors.push('Debes configurar al menos un bloque de tiempo para estudiar.');
    }
    
    // Validar que los bloques de tiempo tengan duración suficiente
    for (const block of body.preferredTimeBlocks || []) {
      const blockMinutes = (block.endHour * 60 + block.endMinute) - (block.startHour * 60 + block.startMinute);
      if (blockMinutes < body.minSessionMinutes) {
        warnings.push(
          `El bloque de tiempo ${block.startHour}:${String(block.startMinute).padStart(2, '0')} - ` +
          `${block.endHour}:${String(block.endMinute).padStart(2, '0')} (${blockMinutes} min) ` +
          `es menor que el tiempo mínimo de sesión (${body.minSessionMinutes} min).`
        );
      }
    }
    
    // VALIDACIÓN 5: Calcular tiempo disponible por semana
    let totalWeeklyMinutesAvailable = 0;
    for (const block of body.preferredTimeBlocks || []) {
      const blockMinutes = (block.endHour * 60 + block.endMinute) - (block.startHour * 60 + block.startMinute);
      totalWeeklyMinutesAvailable += blockMinutes * body.preferredDays.length;
    }
    
    // Estimar semanas para completar
    const effectiveMinutesPerWeek = Math.min(
      totalWeeklyMinutesAvailable,
      body.goalHoursPerWeek ? body.goalHoursPerWeek * 60 : totalWeeklyMinutesAvailable
    );
    const estimatedWeeksToComplete = effectiveMinutesPerWeek > 0 
      ? Math.ceil(totalEstimatedMinutes / effectiveMinutesPerWeek) 
      : 0;
    
    // VALIDACIÓN 6: Para B2B, verificar plazos
    let meetsDeadlines = true;
    const deadlineIssues: ValidationResult['deadlineIssues'] = [];
    
    if (userContext.userType === 'b2b') {
      const now = new Date();
      let weeksUsed = 0;
      
      for (const courseAssignment of userContext.courses) {
        if (courseAssignment.dueDate && body.courseIds.includes(courseAssignment.courseId)) {
          const dueDate = new Date(courseAssignment.dueDate);
          const remaining = await CourseAnalysisService.calculateRemainingTime(user.id, courseAssignment.courseId);
          
          // Calcular cuántas semanas necesita este curso
          const weeksForCourse = effectiveMinutesPerWeek > 0 
            ? Math.ceil(remaining.totalRemainingMinutes / effectiveMinutesPerWeek)
            : 0;
          
          const estimatedCompletionDate = new Date(now);
          estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + (weeksUsed + weeksForCourse) * 7);
          
          if (estimatedCompletionDate > dueDate) {
            meetsDeadlines = false;
            const daysOverdue = Math.ceil((estimatedCompletionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            deadlineIssues.push({
              courseId: courseAssignment.courseId,
              courseTitle: courseAssignment.course.title,
              dueDate: courseAssignment.dueDate,
              estimatedCompletionDate: estimatedCompletionDate.toISOString(),
              daysOverdue,
            });
            
            errors.push(
              `El curso "${courseAssignment.course.title}" tiene fecha límite ${new Date(courseAssignment.dueDate).toLocaleDateString()}, ` +
              `pero con la configuración actual se completaría aproximadamente ${daysOverdue} días después.`
            );
            suggestions.push(
              `Para completar "${courseAssignment.course.title}" a tiempo, considera aumentar las horas de estudio ` +
              `o comenzar con este curso primero.`
            );
          }
          
          weeksUsed += weeksForCourse;
        }
      }
    }
    
    // VALIDACIÓN 7: Conflictos con calendario
    if (body.calendarEvents && body.calendarEvents.length > 0) {
      // Verificar si algún bloque de tiempo se solapa con eventos
      for (const event of body.calendarEvents) {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const eventDay = eventStart.getDay();
        
        if (body.preferredDays.includes(eventDay)) {
          const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
          const eventEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
          
          for (const block of body.preferredTimeBlocks || []) {
            const blockStart = block.startHour * 60 + block.startMinute;
            const blockEnd = block.endHour * 60 + block.endMinute;
            
            // Verificar solapamiento
            if (blockStart < eventEndMinutes && blockEnd > eventStartMinutes) {
              warnings.push(
                `El bloque de estudio ${block.startHour}:${String(block.startMinute).padStart(2, '0')} - ` +
                `${block.endHour}:${String(block.endMinute).padStart(2, '0')} se solapa con el evento "${event.title}".`
              );
            }
          }
        }
      }
    }
    
    const isValid = errors.length === 0;
    
    return NextResponse.json({
      success: true,
      data: {
        isValid,
        errors,
        warnings,
        suggestions,
        minimumLessonTime: Math.ceil(minimumLessonTime),
        totalEstimatedMinutes,
        estimatedWeeksToComplete,
        meetsDeadlines,
        deadlineIssues: deadlineIssues.length > 0 ? deadlineIssues : undefined,
      },
    });
    
  } catch (error) {
    console.error('Error validando tiempos de sesión:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
