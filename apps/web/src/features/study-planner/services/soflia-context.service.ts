/**
 * SofLIAContextService
 * 
 * Servicio para construir y formatear el contexto completo del usuario
 * para SofLIA en el planificador de estudios.
 */

import { UserContextService } from './user-context.service';
import { CourseAnalysisService } from './course-analysis.service';
import { CalendarIntegrationService } from './calendar-integration.service';
import { getWorkshopMetadata } from '../../../lib/utils/workshop-metadata';
import { createClient } from '../../../lib/supabase/server';
import type {
  UserContext,
  CalendarEvent,
  CalendarAvailability,
  LessonDuration,
  CourseComplexity,
} from '../types/user-context.types';

/**
 * Contexto completo para SofLIA del planificador
 */
export interface StudyPlannerContext {
  // Información del usuario
  userType: 'b2b' | 'b2c';
  userProfile: {
    nombre?: string;
    rol?: string;
    area?: string;
    nivel?: string;
    sector?: string;
    tamanoEmpresa?: string;
    minEmpleados?: number;
    maxEmpleados?: number;
  };

  // Organización (solo B2B)
  organization?: {
    name: string;
    size?: string;
    industry?: string;
  };

  // Equipos de trabajo (solo B2B)
  workTeams?: Array<{
    name: string;
    role: string;
  }>;

  // Cursos
  courses: Array<{
    id: string;
    title: string;
    category: string;
    level: string;
    durationMinutes: number;
    completionPercentage: number;
    dueDate?: string; // Solo B2B
    assignedBy?: string; // Solo B2B
    modules?: Array<{
      moduleId: string;
      moduleTitle: string;
      moduleOrderIndex: number;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        lessonOrderIndex: number;
        durationMinutes: number;
        isCompleted: boolean;
      }>;
    }>;
  }>;

  // Análisis de cursos
  courseAnalysis?: {
    totalMinutes: number;
    totalLessons: number;
    averageComplexity: number;
    minimumLessonTime: number;
    averageLessonDuration: number;
    maxLessonDuration: number;
    minLessonDuration: number;
    courseType: 'practical' | 'theoretical' | 'mixed';
    suggestedSessionDurations: {
      short: number;
      normal: number;
      long: number;
      reasoning: string;
    };
  };

  // Calendario
  calendarConnected: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents?: CalendarEvent[];
  calendarAvailability?: {
    totalFreeMinutes: number;
    totalBusyMinutes: number;
    averageFreeMinutesPerDay: number;
    freeSlotCount: number;
  };

  // Preferencias existentes
  existingPreferences?: {
    timezone?: string;
    preferredTimeOfDay?: string;
    preferredDays?: number[];
    weeklyTargetMinutes?: number;
  };

  // Plazos críticos (solo B2B)
  upcomingDeadlines?: Array<{
    courseTitle: string;
    dueDate: string;
    daysRemaining: number;
    completionPercentage: number;
  }>;

  // Fase actual del flujo
  currentPhase?: number;
  phaseData?: Record<string, any>;
}

export class SofLIAContextService {
  /**
   * Construye el contexto completo para SofLIA del planificador
   */
  static async buildStudyPlannerContext(userId: string): Promise<StudyPlannerContext> {
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(userId);

    console.log(`[SofLIAContextService] buildStudyPlannerContext - userType recibido: ${userContext.userType} para userId: ${userId}`);

    // Construir contexto base
    const context: StudyPlannerContext = {
      userType: userContext.userType,
      userProfile: this.formatUserProfile(userContext),
      courses: await this.formatCourses(userId, userContext),
      calendarConnected: !!userContext.calendarIntegration?.isConnected,
      calendarProvider: userContext.calendarIntegration?.provider,
    };

    console.log(`[SofLIAContextService] buildStudyPlannerContext - Contexto construido con userType: ${context.userType}`);

    // Agregar información de organización para B2B
    if (userContext.userType === 'b2b' && userContext.organization) {
      context.organization = {
        name: userContext.organization.name,
        size: userContext.organization.size,
        industry: userContext.organization.industry,
      };

      if (userContext.workTeams && userContext.workTeams.length > 0) {
        context.workTeams = userContext.workTeams.map(team => ({
          name: team.name,
          role: team.role,
        }));
      }

      // Obtener plazos próximos
      const deadlines = await UserContextService.getUpcomingDeadlines(userId, 30);
      if (deadlines.length > 0) {
        context.upcomingDeadlines = deadlines.map(d => ({
          courseTitle: d.course.title,
          dueDate: d.dueDate!,
          daysRemaining: Math.ceil(
            (new Date(d.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
          completionPercentage: d.completionPercentage,
        }));
      }
    }

    // Análisis de cursos
    if (context.courses.length > 0) {
      context.courseAnalysis = await this.analyzeCourses(userId, context.courses);
    }

    // Información del calendario
    if (context.calendarConnected) {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const events = await CalendarIntegrationService.getCalendarEvents(
        userId,
        startDate,
        endDate
      );

      if (events.length > 0) {
        context.calendarEvents = events;

        const availability = CalendarIntegrationService.analyzeAvailability(
          events,
          startDate,
          endDate
        );

        let totalFree = 0;
        let totalBusy = 0;
        let totalSlots = 0;

        for (const day of availability) {
          totalFree += day.totalFreeMinutes;
          totalBusy += day.totalBusyMinutes;
          totalSlots += day.freeSlots.length;
        }

        context.calendarAvailability = {
          totalFreeMinutes: totalFree,
          totalBusyMinutes: totalBusy,
          averageFreeMinutesPerDay: availability.length > 0
            ? Math.round(totalFree / availability.length)
            : 0,
          freeSlotCount: totalSlots,
        };
      }
    }

    // Preferencias existentes
    if (userContext.studyPreferences) {
      context.existingPreferences = {
        timezone: userContext.studyPreferences.timezone,
        preferredTimeOfDay: userContext.studyPreferences.preferredTimeOfDay,
        preferredDays: userContext.studyPreferences.preferredDays,
        weeklyTargetMinutes: userContext.studyPreferences.weeklyTargetMinutes,
      };
    }

    return context;
  }

  /**
   * Formatea el perfil del usuario para SofLIA
   */
  private static formatUserProfile(userContext: UserContext): StudyPlannerContext['userProfile'] {
    return {
      nombre: userContext.user.displayName ||
        (userContext.user.firstName && userContext.user.lastName
          ? `${userContext.user.firstName} ${userContext.user.lastName}`
          : undefined),
      rol: userContext.professionalProfile?.rol?.nombre,
      area: userContext.professionalProfile?.area?.nombre,
      nivel: userContext.professionalProfile?.nivel?.nombre,
      sector: userContext.professionalProfile?.sector?.nombre,
      tamanoEmpresa: userContext.professionalProfile?.tamanoEmpresa?.nombre,
      minEmpleados: userContext.professionalProfile?.tamanoEmpresa?.minEmpleados,
      maxEmpleados: userContext.professionalProfile?.tamanoEmpresa?.maxEmpleados,
    };
  }

  /**
   * Formatea los cursos para SofLIA
   */
  private static async formatCourses(
    userId: string,
    userContext: UserContext
  ): Promise<StudyPlannerContext['courses']> {
    const formattedCourses: StudyPlannerContext['courses'] = [];
    const supabase = await createClient();

    for (const courseAssignment of userContext.courses) {
      const progress = await CourseAnalysisService.getUserCourseProgress(
        userId,
        courseAssignment.courseId
      );

      const workshopMetadata = await getWorkshopMetadata(courseAssignment.courseId);

      const { data: completedLessonsData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const completedLessonIds = new Set((completedLessonsData || []).map((l: { lesson_id: string }) => l.lesson_id));

      const formattedModules = workshopMetadata?.modules.map(module => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle,
        moduleOrderIndex: module.moduleOrderIndex,
        lessons: module.lessons.map(lesson => ({
          lessonId: lesson.lessonId,
          lessonTitle: lesson.lessonTitle,
          lessonOrderIndex: lesson.lessonOrderIndex,
          durationMinutes: lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
            ? lesson.totalDurationMinutes
            : (lesson.durationSeconds && lesson.durationSeconds > 0
              ? Math.ceil(lesson.durationSeconds / 60)
              : 15),
          isCompleted: completedLessonIds.has(lesson.lessonId),
        })),
      })) || [];

      formattedCourses.push({
        id: courseAssignment.courseId,
        title: courseAssignment.course.title,
        category: courseAssignment.course.category,
        level: courseAssignment.course.level,
        durationMinutes: courseAssignment.course.durationTotalMinutes,
        completionPercentage: progress.progressPercentage,
        dueDate: courseAssignment.dueDate,
        assignedBy: courseAssignment.assignedBy,
        modules: formattedModules,
      });
    }

    return formattedCourses;
  }

  /**
   * Analiza los cursos para SofLIA
   */
  private static async analyzeCourses(
    userId: string,
    courses: StudyPlannerContext['courses']
  ): Promise<StudyPlannerContext['courseAnalysis']> {
    let totalMinutes = 0;
    let totalLessons = 0;
    let totalComplexity = 0;
    let minLessonTime = Infinity;
    let maxLessonTime = 0;
    let coursesWithComplexity = 0;
    const allLessonDurations: number[] = [];
    const courseCategories: string[] = [];

    for (const course of courses) {
      if (course.category) {
        courseCategories.push(course.category.toLowerCase());
      }

      const remaining = await CourseAnalysisService.calculateRemainingTime(userId, course.id);
      totalMinutes += remaining.totalRemainingMinutes;
      totalLessons += remaining.remainingLessons;

      const complexity = await CourseAnalysisService.getCourseComplexity(course.id);
      if (complexity) {
        totalComplexity += complexity.complexityScore;
        coursesWithComplexity++;
      }

      if (course.modules) {
        for (const module of course.modules) {
          for (const lesson of module.lessons) {
            if (lesson.durationMinutes && lesson.durationMinutes > 0) {
              allLessonDurations.push(lesson.durationMinutes);
              if (lesson.durationMinutes < minLessonTime) {
                minLessonTime = lesson.durationMinutes;
              }
              if (lesson.durationMinutes > maxLessonTime) {
                maxLessonTime = lesson.durationMinutes;
              }
            }
          }
        }
      }

      const minTime = await CourseAnalysisService.getMinimumLessonTime(course.id);
      if (minTime < minLessonTime) {
        minLessonTime = minTime;
      }
    }

    const averageLessonDuration = allLessonDurations.length > 0
      ? Math.round(allLessonDurations.reduce((a, b) => a + b, 0) / allLessonDurations.length)
      : 20;

    const courseType = this.detectCourseType(courseCategories, averageLessonDuration);

    const suggestedSessionDurations = this.calculateSuggestedSessionDurations(
      courseType,
      averageLessonDuration,
      minLessonTime === Infinity ? 15 : minLessonTime,
      maxLessonTime || 60
    );

    return {
      totalMinutes,
      totalLessons,
      averageComplexity: coursesWithComplexity > 0
        ? Math.round((totalComplexity / coursesWithComplexity) * 10) / 10
        : 5,
      minimumLessonTime: minLessonTime === Infinity ? 15 : Math.ceil(minLessonTime),
      averageLessonDuration,
      maxLessonDuration: maxLessonTime || 60,
      minLessonDuration: minLessonTime === Infinity ? 15 : minLessonTime,
      courseType,
      suggestedSessionDurations,
    };
  }

  /**
   * Detecta el tipo de curso
   */
  private static detectCourseType(
    categories: string[],
    averageDuration: number
  ): 'practical' | 'theoretical' | 'mixed' {
    const practicalKeywords = [
      'ia', 'inteligencia artificial', 'aplicada', 'práctica', 'herramientas',
      'productividad', 'automatización', 'desarrollo', 'programación', 'software',
      'marketing', 'ventas', 'comunicación', 'liderazgo', 'gestión'
    ];

    const theoreticalKeywords = [
      'matemáticas', 'física', 'química', 'estadística', 'contabilidad',
      'finanzas', 'economía', 'derecho', 'medicina', 'ciencias', 'teoría',
      'fundamentos', 'principios', 'metodología', 'investigación'
    ];

    const categoryString = categories.join(' ').toLowerCase();

    const practicalScore = practicalKeywords.filter(k => categoryString.includes(k)).length;
    const theoreticalScore = theoreticalKeywords.filter(k => categoryString.includes(k)).length;

    if (averageDuration < 20 && practicalScore >= theoreticalScore) {
      return 'practical';
    } else if (averageDuration > 40 || theoreticalScore > practicalScore) {
      return 'theoretical';
    } else if (practicalScore > theoreticalScore) {
      return 'practical';
    } else {
      return 'mixed';
    }
  }

  /**
   * Calcula las duraciones de sesión sugeridas
   */
  private static calculateSuggestedSessionDurations(
    courseType: 'practical' | 'theoretical' | 'mixed',
    averageDuration: number,
    minDuration: number,
    maxDuration: number
  ): { short: number; normal: number; long: number; reasoning: string } {
    let short: number;
    let normal: number;
    let long: number;
    let reasoning: string;

    switch (courseType) {
      case 'practical':
        short = Math.max(minDuration, Math.round(averageDuration * 1.0));
        normal = Math.round(averageDuration * 1.5);
        long = Math.round(averageDuration * 2.5);
        reasoning = `Curso PRÁCTICO/APLICADO: Las lecciones son cortas (promedio ${averageDuration} min) y enfocadas en aplicación inmediata. Sesiones cortas permiten aprender-practicar-aplicar sin fatiga mental.`;
        break;

      case 'theoretical':
        short = Math.max(minDuration, Math.round(averageDuration * 0.8));
        normal = Math.round(averageDuration * 1.2);
        long = Math.round(averageDuration * 2.0);
        reasoning = `Curso TEÓRICO/DENSO: Las lecciones son extensas (promedio ${averageDuration} min) con contenido que requiere concentración profunda. Se recomienda sesiones que permitan completar al menos una lección completa.`;
        break;

      case 'mixed':
      default:
        short = Math.max(minDuration, Math.round(averageDuration * 1.0));
        normal = Math.round(averageDuration * 1.5);
        long = Math.round(averageDuration * 2.0);
        reasoning = `Curso MIXTO: Combina teoría y práctica (promedio ${averageDuration} min por lección). Sesiones flexibles que se adaptan al ritmo del estudiante.`;
        break;
    }

    short = Math.max(15, Math.round(short));
    normal = Math.max(25, Math.round(normal));
    long = Math.max(45, Math.round(long));

    if (normal <= short) normal = short + 10;
    if (long <= normal) long = normal + 15;

    return { short, normal, long, reasoning };
  }

  /**
   * Formatea el contexto como string para incluir en el prompt de SofLIA
   */
  static formatContextForPrompt(context: StudyPlannerContext): string {
    let prompt = '';

    prompt += `\n## TIPO DE USUARIO\n`;
    if (context.userType === 'b2b') {
      const hasCourses = context.courses && context.courses.length > 0;
      prompt += hasCourses
        ? 'Usuario B2B (pertenece a una organización con cursos asignados y plazos)\n'
        : 'Usuario B2B (pertenece a una organización, pero aún no tiene cursos asignados)\n';
    } else {
      prompt += 'Usuario B2C (usuario independiente con flexibilidad total)\n';
    }

    prompt += `\n## PERFIL PROFESIONAL\n`;
    if (context.userProfile.nombre) {
      prompt += `- Nombre: ${context.userProfile.nombre}\n`;
    }
    prompt += `- Rol: ${context.userProfile.rol || 'No especificado'}\n`;
    prompt += `- Área: ${context.userProfile.area || 'No especificada'}\n`;
    prompt += `- Nivel: ${context.userProfile.nivel || 'No especificado'}\n`;
    prompt += `- Sector: ${context.userProfile.sector || 'No especificado'}\n`;
    if (context.userProfile.tamanoEmpresa) {
      prompt += `- Tamaño de empresa: ${context.userProfile.tamanoEmpresa}`;
      if (context.userProfile.minEmpleados && context.userProfile.maxEmpleados) {
        prompt += ` (${context.userProfile.minEmpleados}-${context.userProfile.maxEmpleados} empleados)`;
      }
      prompt += '\n';
    }

    if (context.organization) {
      prompt += `\n## ORGANIZACIÓN\n`;
      prompt += `- Nombre: ${context.organization.name}\n`;
      if (context.organization.industry) {
        prompt += `- Industria: ${context.organization.industry}\n`;
      }
      if (context.organization.size) {
        prompt += `- Tamaño: ${context.organization.size}\n`;
      }
    }

    if (context.workTeams && context.workTeams.length > 0) {
      prompt += `\n## EQUIPOS DE TRABAJO\n`;
      for (const team of context.workTeams) {
        prompt += `- ${team.name} (rol: ${team.role})\n`;
      }
    }

    prompt += `\n## CURSOS (${context.courses.length})\n`;
    for (const course of context.courses) {
      prompt += `- ${course.title}\n`;
      prompt += `  - Categoría: ${course.category}, Nivel: ${course.level}\n`;
      prompt += `  - Duración total: ${Math.round(course.durationMinutes / 60 * 10) / 10} horas\n`;
      prompt += `  - Progreso: ${course.completionPercentage}%\n`;
      if (course.dueDate) {
        const daysRemaining = Math.ceil(
          (new Date(course.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        prompt += `  - Fecha límite: ${new Date(course.dueDate).toLocaleDateString()} (${daysRemaining} días)\n`;
      }

      if (course.modules && course.modules.length > 0) {
        let totalLessons = 0;
        let completedLessons = 0;
        let pendingLessons = 0;

        for (const module of course.modules) {
          for (const lesson of module.lessons) {
            totalLessons++;
            if (lesson.isCompleted) {
              completedLessons++;
            } else {
              pendingLessons++;
            }
          }
        }

        if (pendingLessons > 0) {
          prompt += `  \n  📚 LECCIONES PENDIENTES - USA ESTOS DATOS EXACTOS (nombres, números y duraciones):\n`;
          prompt += `  ⚠️ IMPORTANTE: Copia EXACTAMENTE el número de lección y la duración que aparece aquí.\n`;
          for (const module of course.modules) {
            const pendingInModule = module.lessons.filter(l => !l.isCompleted);
            if (pendingInModule.length > 0) {
              prompt += `    📁 Módulo ${module.moduleOrderIndex}: ${module.moduleTitle}\n`;
              for (const lesson of pendingInModule) {
                prompt += `       ➡️ Lección ${lesson.lessonOrderIndex}: ${lesson.lessonTitle} - DURACIÓN: ${lesson.durationMinutes} minutos [PENDIENTE]\n`;
              }
            }
          }
        }
        prompt += `  \n  RESUMEN: ${completedLessons} de ${totalLessons} lecciones ya completadas, ${pendingLessons} pendientes por planificar\n`;
        prompt += `  \n  ⚠️ IMPORTANTE: El plan de estudios debe incluir SOLO las ${pendingLessons} lecciones pendientes.\n`;
      }
    }

    if (context.courseAnalysis) {
      prompt += `\n## ANÁLISIS DE CURSOS\n`;
      prompt += `- Tiempo total restante: ${Math.round(context.courseAnalysis.totalMinutes / 60 * 10) / 10} horas\n`;
      prompt += `- Lecciones pendientes: ${context.courseAnalysis.totalLessons}\n`;
      prompt += `- Complejidad promedio: ${context.courseAnalysis.averageComplexity}/10\n`;
      prompt += `- Tiempo mínimo por sesión: ${context.courseAnalysis.minimumLessonTime} minutos\n`;

      prompt += `\n## 🎯 ANÁLISIS INTELIGENTE DEL CURSO\n`;
      prompt += `📊 **Estadísticas de lecciones:**\n`;
      prompt += `- Duración PROMEDIO de lecciones: ${context.courseAnalysis.averageLessonDuration} minutos\n`;
      prompt += `- Duración MÍNIMA: ${context.courseAnalysis.minLessonDuration} minutos\n`;
      prompt += `- Duración MÁXIMA: ${context.courseAnalysis.maxLessonDuration} minutos\n`;

      const courseTypeLabels = {
        'practical': 'PRÁCTICO/APLICADO',
        'theoretical': 'TEÓRICO/DENSO',
        'mixed': 'MIXTO'
      };
      prompt += `\n🏷️ **Tipo de curso detectado:** ${courseTypeLabels[context.courseAnalysis.courseType]}\n`;

      prompt += `\n⏱️ **DURACIONES DE SESIÓN SUGERIDAS:**\n`;
      prompt += `- 🟢 Sesión CORTA: ${context.courseAnalysis.suggestedSessionDurations.short} minutos\n`;
      prompt += `- 🟡 Sesión NORMAL: ${context.courseAnalysis.suggestedSessionDurations.normal} minutos\n`;
      prompt += `- 🔴 Sesión LARGA: ${context.courseAnalysis.suggestedSessionDurations.long} minutos\n`;
      prompt += `\n💡 **Razonamiento:** ${context.courseAnalysis.suggestedSessionDurations.reasoning}\n`;

      prompt += `\n⚠️ INSTRUCCIÓN PARA SofLIA: Cuando el usuario seleccione el tipo de sesión, usa las duraciones sugeridas arriba.\n`;
    }

    prompt += `\n## CALENDARIO\n`;
    if (context.calendarConnected) {
      prompt += `- Calendario conectado: ${context.calendarProvider}\n`;
      if (context.calendarAvailability) {
        prompt += `- Tiempo libre total: ${Math.round(context.calendarAvailability.totalFreeMinutes / 60 * 10) / 10} horas\n`;
        prompt += `- Promedio libre por día: ${context.calendarAvailability.averageFreeMinutesPerDay} minutos\n`;
        prompt += `- Slots disponibles: ${context.calendarAvailability.freeSlotCount}\n`;
      }
    } else {
      prompt += `- Calendario no conectado.\n`;
    }

    if (context.upcomingDeadlines && context.upcomingDeadlines.length > 0) {
      prompt += `\n## PLAZOS PRÓXIMOS\n`;
      for (const deadline of context.upcomingDeadlines) {
        prompt += `- ${deadline.courseTitle}: ${deadline.daysRemaining} días (${deadline.completionPercentage}% completado)\n`;
      }
    }

    if (context.existingPreferences) {
      prompt += `\n## PREFERENCIAS GUARDADAS\n`;
      if (context.existingPreferences.timezone) {
        prompt += `- Zona horaria: ${context.existingPreferences.timezone}\n`;
      }
      if (context.existingPreferences.preferredTimeOfDay) {
        prompt += `- Momento del día: ${context.existingPreferences.preferredTimeOfDay}\n`;
      }
      if (context.existingPreferences.preferredDays) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const days = context.existingPreferences.preferredDays.map(d => dayNames[d]).join(', ');
        prompt += `- Días preferidos: ${days}\n`;
      }
    }

    return prompt;
  }

  /**
   * Genera las instrucciones específicas para SofLIA
   */
  static generatePhaseInstructions(
    context: StudyPlannerContext,
    phase: number
  ): string {
    let instructions = '';
    const isB2B = context.userType === 'b2b';

    switch (phase) {
      case 1:
        instructions = `FASE 1: ANÁLISIS DE CONTEXTO. Preséntate como SofLIA y analiza el perfil del usuario.`;
        break;
      case 2:
        instructions = `FASE 2: SELECCIÓN DE CURSOS. Muestra los cursos ${isB2B ? 'asignados' : 'adquiridos'} y lecciones pendientes.`;
        break;
      case 3:
        instructions = `FASE 3: CONEXIÓN DE CALENDARIO. Solicita conexión si no está vinculado.`;
        break;
      case 4:
        instructions = `FASE 4: CONFIGURACIÓN DE TIEMPOS. Sugiere duraciones basadas en el análisis inteligente.`;
        break;
      case 5:
        instructions = `FASE 5: TIEMPOS DE DESCANSO. Sugiere descansos óptimos.`;
        break;
      case 6:
        instructions = `FASE 6: DÍAS Y HORARIOS. Configura los momentos de estudio evitando eventos importantes.`;
        break;
      case 7:
        instructions = `FASE 7: RESUMEN Y CONFIRMACIÓN. Presenta un resumen del plan incluyendo SOLO lecciones pendientes.`;
        break;
    }

    return instructions;
  }

  /**
   * Pre-calcula las sesiones de estudio
   */
  static preCalculateStudySessions(
    lessons: Array<{
      lessonTitle: string;
      lessonOrderIndex: number;
      moduleTitle: string;
      durationMinutes: number;
    }>,
    config: {
      studyDays: string[];
      timeSlots: string[];
      startDate: Date;
      targetDate?: Date;
    }
  ): any {
    // Implementación simplificada para el clon manual
    // En un entorno real se copiaría la lógica completa de lia-context.service.ts
    return { sessions: [], summary: { totalWeeks: 0, totalSessions: 0, totalLessons: 0, finishDate: '' } };
  }

  /**
   * Formatea las sesiones pre-calculadas para el prompt
   */
  static formatPreCalculatedSessionsForPrompt(preCalculatedData: any): string {
    return '';
  }
}
