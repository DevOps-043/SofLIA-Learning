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
    // ✅ NUEVO: Análisis detallado para recomendaciones de sesión
    averageLessonDuration: number; // Promedio de duración de lecciones en minutos
    maxLessonDuration: number; // Duración máxima de una lección
    minLessonDuration: number; // Duración mínima de una lección
    courseType: 'practical' | 'theoretical' | 'mixed'; // Tipo de curso según análisis
    suggestedSessionDurations: {
      short: number; // Sesión corta sugerida
      normal: number; // Sesión normal sugerida
      long: number; // Sesión larga sugerida
      reasoning: string; // Explicación de por qué estas duraciones
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

      // Usar getWorkshopMetadata para obtener módulos y lecciones (misma lógica que /learn)
      const workshopMetadata = await getWorkshopMetadata(courseAssignment.courseId);

      // Obtener lecciones completadas del usuario
      const { data: completedLessonsData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const completedLessonIds = new Set((completedLessonsData || []).map((l: { lesson_id: string }) => l.lesson_id));

      // Formatear módulos y lecciones usando los datos del workshopMetadata
      const formattedModules = workshopMetadata?.modules.map(module => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle,
        moduleOrderIndex: module.moduleOrderIndex,
        lessons: module.lessons.map(lesson => ({
          lessonId: lesson.lessonId,
          lessonTitle: lesson.lessonTitle,
          lessonOrderIndex: lesson.lessonOrderIndex,
          // ✅ CORRECCIÓN: Usar totalDurationMinutes que ya está correctamente calculado en workshop-metadata.ts
          // Prioridad: totalDurationMinutes > durationSeconds/60 > 15 (fallback)
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
   * Analiza los cursos para SofLIA - Incluyendo análisis inteligente para sugerir duraciones de sesión
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
      // Guardar categoría del curso
      if (course.category) {
        courseCategories.push(course.category.toLowerCase());
      }

      // Tiempo restante
      const remaining = await CourseAnalysisService.calculateRemainingTime(userId, course.id);
      totalMinutes += remaining.totalRemainingMinutes;
      totalLessons += remaining.remainingLessons;

      // Complejidad
      const complexity = await CourseAnalysisService.getCourseComplexity(course.id);
      if (complexity) {
        totalComplexity += complexity.complexityScore;
        coursesWithComplexity++;
      }

      // Recopilar duraciones de todas las lecciones
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

      // Tiempo mínimo de lección (fallback al servicio)
      const minTime = await CourseAnalysisService.getMinimumLessonTime(course.id);
      if (minTime < minLessonTime) {
        minLessonTime = minTime;
      }
    }

    // Calcular promedio de duración de lecciones
    const averageLessonDuration = allLessonDurations.length > 0
      ? Math.round(allLessonDurations.reduce((a, b) => a + b, 0) / allLessonDurations.length)
      : 20; // Fallback a 20 min si no hay datos

    // Detectar tipo de curso según categorías
    const courseType = this.detectCourseType(courseCategories, averageLessonDuration);

    // Generar sugerencias de duración de sesión adaptadas al tipo de curso
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
      // ✅ NUEVO: Campos de análisis inteligente
      averageLessonDuration,
      maxLessonDuration: maxLessonTime || 60,
      minLessonDuration: minLessonTime === Infinity ? 15 : minLessonTime,
      courseType,
      suggestedSessionDurations,
    };
  }

  /**
   * Detecta el tipo de curso basándose en las categorías y duración promedio
   */
  private static detectCourseType(
    categories: string[],
    averageDuration: number
  ): 'practical' | 'theoretical' | 'mixed' {
    // Categorías que indican cursos prácticos/aplicados
    const practicalKeywords = [
      'ia', 'inteligencia artificial', 'aplicada', 'práctica', 'herramientas',
      'productividad', 'automatización', 'desarrollo', 'programación', 'software',
      'marketing', 'ventas', 'comunicación', 'liderazgo', 'gestión'
    ];

    // Categorías que indican cursos teóricos/densos
    const theoreticalKeywords = [
      'matemáticas', 'física', 'química', 'estadística', 'contabilidad',
      'finanzas', 'economía', 'derecho', 'medicina', 'ciencias', 'teoría',
      'fundamentos', 'principios', 'metodología', 'investigación'
    ];

    const categoryString = categories.join(' ').toLowerCase();

    const practicalScore = practicalKeywords.filter(k => categoryString.includes(k)).length;
    const theoreticalScore = theoreticalKeywords.filter(k => categoryString.includes(k)).length;

    // También considerar la duración promedio
    // Lecciones cortas (<20min) tienden a ser prácticas
    // Lecciones largas (>40min) tienden a ser teóricas
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
   * Calcula las duraciones de sesión sugeridas basándose en el análisis del curso
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
        // Cursos prácticos: sesiones más cortas pero frecuentes
        // Ideal para aprender y aplicar inmediatamente
        short = Math.max(minDuration, Math.round(averageDuration * 1.0)); // 1 lección
        normal = Math.round(averageDuration * 1.5); // 1-2 lecciones
        long = Math.round(averageDuration * 2.5); // 2-3 lecciones
        reasoning = `Curso PRÁCTICO/APLICADO: Las lecciones son cortas (promedio ${averageDuration} min) y enfocadas en aplicación inmediata. Sesiones cortas permiten aprender-practicar-aplicar sin fatiga mental.`;
        break;

      case 'theoretical':
        // Cursos teóricos: sesiones más largas para absorber contenido denso
        // Necesitan más tiempo de concentración
        short = Math.max(minDuration, Math.round(averageDuration * 0.8)); // Parte de 1 lección
        normal = Math.round(averageDuration * 1.2); // 1 lección completa
        long = Math.round(averageDuration * 2.0); // 1-2 lecciones
        reasoning = `Curso TEÓRICO/DENSO: Las lecciones son extensas (promedio ${averageDuration} min) con contenido que requiere concentración profunda. Se recomienda sesiones que permitan completar al menos una lección completa.`;
        break;

      case 'mixed':
      default:
        // Cursos mixtos: balance entre duración y frecuencia
        short = Math.max(minDuration, Math.round(averageDuration * 1.0));
        normal = Math.round(averageDuration * 1.5);
        long = Math.round(averageDuration * 2.0);
        reasoning = `Curso MIXTO: Combina teoría y práctica (promedio ${averageDuration} min por lección). Sesiones flexibles que se adaptan al ritmo del estudiante.`;
        break;
    }

    // Asegurar mínimos razonables
    short = Math.max(15, Math.round(short));
    normal = Math.max(25, Math.round(normal));
    long = Math.max(45, Math.round(long));

    // Asegurar que short < normal < long
    if (normal <= short) normal = short + 10;
    if (long <= normal) long = normal + 15;

    return { short, normal, long, reasoning };
  }

  /**
   * Formatea el contexto como string para incluir en el prompt de LIA
   */
  static formatContextForPrompt(context: StudyPlannerContext): string {
    let prompt = '';

    // Tipo de usuario
    prompt += `\n## TIPO DE USUARIO\n`;
    if (context.userType === 'b2b') {
      const hasCourses = context.courses && context.courses.length > 0;
      prompt += hasCourses
        ? 'Usuario B2B (pertenece a una organización con cursos asignados y plazos)\n'
        : 'Usuario B2B (pertenece a una organización, pero aún no tiene cursos asignados)\n';
    } else {
      prompt += 'Usuario B2C (usuario independiente con flexibilidad total)\n';
    }

    // Perfil profesional
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

    // Organización (B2B)
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

    // Equipos de trabajo (B2B)
    if (context.workTeams && context.workTeams.length > 0) {
      prompt += `\n## EQUIPOS DE TRABAJO\n`;
      for (const team of context.workTeams) {
        prompt += `- ${team.name} (rol: ${team.role})\n`;
      }
    }

    // Cursos
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
      if (course.assignedBy) {
        prompt += `  - Asignado por: ${course.assignedBy}\n`;
      }

      // Agregar módulos y lecciones si están disponibles
      if (course.modules && course.modules.length > 0) {
        let totalLessons = 0;
        let completedLessons = 0;
        let pendingLessons = 0;

        // Primero contar todas las lecciones para el resumen
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

        // IMPORTANTE: Solo mostrar lecciones PENDIENTES a SofLIA
        // Las lecciones completadas no deben incluirse en el plan de estudios
        if (pendingLessons > 0) {
          prompt += `  \n  📚 LECCIONES PENDIENTES - USA ESTOS DATOS EXACTOS (nombres, números y duraciones):\n`;
          prompt += `  ⚠️ IMPORTANTE: Copia EXACTAMENTE el número de lección y la duración que aparece aquí.\n`;
          for (const module of course.modules) {
            // Solo mostrar módulos que tengan lecciones pendientes
            const pendingInModule = module.lessons.filter(l => !l.isCompleted);
            if (pendingInModule.length > 0) {
              prompt += `    📁 Módulo ${module.moduleOrderIndex}: ${module.moduleTitle}\n`;
              for (const lesson of pendingInModule) {
                // Usar formato claro: "Lección [NÚMERO]: [TÍTULO] - DURACIÓN: [X] minutos"
                prompt += `       ➡️ Lección ${lesson.lessonOrderIndex}: ${lesson.lessonTitle} - DURACIÓN: ${lesson.durationMinutes} minutos [PENDIENTE]\n`;
              }
            }
          }
          prompt += `  \n  ⚠️ RECUERDA: Usa el número de lección EXACTO (ej: "Lección 1", "Lección 2", "Lección 3.1") y la duración EXACTA en minutos.\n`;
        }

        prompt += `  \n  RESUMEN: ${completedLessons} de ${totalLessons} lecciones ya completadas, ${pendingLessons} pendientes por planificar\n`;
        prompt += `  \n  ⚠️ IMPORTANTE: El plan de estudios debe incluir SOLO las ${pendingLessons} lecciones pendientes, comenzando desde la primera lección no completada.\n`;
      }
    }

    // Análisis de cursos
    if (context.courseAnalysis) {
      prompt += `\n## ANÁLISIS DE CURSOS\n`;
      prompt += `- Tiempo total restante: ${Math.round(context.courseAnalysis.totalMinutes / 60 * 10) / 10} horas\n`;
      prompt += `- Lecciones pendientes: ${context.courseAnalysis.totalLessons}\n`;
      prompt += `- Complejidad promedio: ${context.courseAnalysis.averageComplexity}/10\n`;
      prompt += `- Tiempo mínimo por sesión: ${context.courseAnalysis.minimumLessonTime} minutos (para completar al menos una lección)\n`;

      // ✅ NUEVO: Análisis inteligente de tipo de curso y duraciones sugeridas
      prompt += `\n## 🎯 ANÁLISIS INTELIGENTE DEL CURSO\n`;

      // Estadísticas de lecciones
      prompt += `📊 **Estadísticas de lecciones:**\n`;
      prompt += `- Duración PROMEDIO de lecciones: ${context.courseAnalysis.averageLessonDuration} minutos\n`;
      prompt += `- Duración MÍNIMA: ${context.courseAnalysis.minLessonDuration} minutos\n`;
      prompt += `- Duración MÁXIMA: ${context.courseAnalysis.maxLessonDuration} minutos\n`;

      // Tipo de curso detectado
      const courseTypeLabels = {
        'practical': 'PRÁCTICO/APLICADO (aprender y aplicar inmediatamente)',
        'theoretical': 'TEÓRICO/DENSO (contenido extenso que requiere concentración)',
        'mixed': 'MIXTO (combina teoría y práctica)'
      };
      prompt += `\n🏷️ **Tipo de curso detectado:** ${courseTypeLabels[context.courseAnalysis.courseType]}\n`;

      // Duraciones de sesión sugeridas
      prompt += `\n⏱️ **DURACIONES DE SESIÓN SUGERIDAS (basadas en el análisis del curso):**\n`;
      prompt += `- 🟢 Sesión CORTA: ${context.courseAnalysis.suggestedSessionDurations.short} minutos\n`;
      prompt += `- 🟡 Sesión NORMAL: ${context.courseAnalysis.suggestedSessionDurations.normal} minutos\n`;
      prompt += `- 🔴 Sesión LARGA: ${context.courseAnalysis.suggestedSessionDurations.long} minutos\n`;
      prompt += `\n💡 **Razonamiento:** ${context.courseAnalysis.suggestedSessionDurations.reasoning}\n`;

      prompt += `\n⚠️ INSTRUCCIÓN PARA SofLIA: Cuando el usuario seleccione el tipo de sesión, usa las duraciones sugeridas arriba, NO uses valores fijos genéricos como 25/45/60.\n`;
    }

    // Calendario
    prompt += `\n## CALENDARIO\n`;
    if (context.calendarConnected) {
      prompt += `- Calendario conectado: ${context.calendarProvider === 'google' ? 'Google Calendar' : 'Microsoft Calendar'}\n`;
      if (context.calendarAvailability) {
        prompt += `- Tiempo libre total (próximas 2 semanas): ${Math.round(context.calendarAvailability.totalFreeMinutes / 60 * 10) / 10} horas\n`;
        prompt += `- Tiempo ocupado total: ${Math.round(context.calendarAvailability.totalBusyMinutes / 60 * 10) / 10} horas\n`;
        prompt += `- Promedio libre por día: ${context.calendarAvailability.averageFreeMinutesPerDay} minutos\n`;
        prompt += `- Slots disponibles: ${context.calendarAvailability.freeSlotCount}\n`;
      }
    } else {
      prompt += `- Calendario no conectado. Es IMPORTANTE pedir al usuario que conecte su calendario para analizar su disponibilidad real.\n`;
    }

    // Plazos próximos (B2B)
    if (context.upcomingDeadlines && context.upcomingDeadlines.length > 0) {
      prompt += `\n## PLAZOS PRÓXIMOS (¡IMPORTANTE!)\n`;
      for (const deadline of context.upcomingDeadlines) {
        prompt += `- ${deadline.courseTitle}: ${deadline.daysRemaining} días (${deadline.completionPercentage}% completado)\n`;
        if (deadline.daysRemaining < 7) {
          prompt += `  ⚠️ URGENTE: Menos de una semana para completar\n`;
        }
      }
    }

    // Preferencias existentes
    if (context.existingPreferences) {
      prompt += `\n## PREFERENCIAS GUARDADAS\n`;
      if (context.existingPreferences.timezone) {
        prompt += `- Zona horaria: ${context.existingPreferences.timezone}\n`;
      }
      if (context.existingPreferences.preferredTimeOfDay) {
        prompt += `- Momento del día preferido: ${context.existingPreferences.preferredTimeOfDay}\n`;
      }
      if (context.existingPreferences.preferredDays) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const days = context.existingPreferences.preferredDays.map(d => dayNames[d]).join(', ');
        prompt += `- Días preferidos: ${days}\n`;
      }
      if (context.existingPreferences.weeklyTargetMinutes) {
        prompt += `- Meta semanal: ${Math.round(context.existingPreferences.weeklyTargetMinutes / 60 * 10) / 10} horas\n`;
      }
    }

    return prompt;
  }

  /**
   * Genera las instrucciones específicas para SofLIA según el tipo de usuario y fase
   */
  static generatePhaseInstructions(
    context: StudyPlannerContext,
    phase: number
  ): string {
    let instructions = '';

    const isB2B = context.userType === 'b2b';

    switch (phase) {
      case 1: // Análisis de contexto
        instructions = `
FASE 1: ANÁLISIS DE CONTEXTO

Tu objetivo es presentarte y analizar el perfil del usuario para estimar su disponibilidad.

${isB2B ? `
INSTRUCCIONES PARA USUARIO B2B:
- Este usuario pertenece a una organización
- Sus cursos ya están asignados con plazos fijos
- Debes considerar los plazos al estimar tiempos
- No puede seleccionar otros cursos, solo organizar su tiempo
` : `
INSTRUCCIONES PARA USUARIO B2C:
- Este usuario es independiente
- Tiene flexibilidad total para elegir cursos
- Puede establecer o no metas de tiempo fijas
- Puedes sugerirle rutas de aprendizaje y cursos adicionales
`}

ACCIONES:
1. Saluda al usuario por su nombre si lo conoces
2. Explica brevemente que analizarás su perfil
3. Presenta tu análisis de disponibilidad estimada basándote en:
   - Rol profesional (C-Level tiene menos tiempo que gerencia media)
   - Tamaño de empresa (empresas grandes = menos tiempo)
   - Nivel jerárquico
   - Área profesional
4. Pregunta si el análisis le parece correcto
`;
        break;

      case 2: // Selección de cursos
        if (isB2B) {
          const hasCourses = context.courses && context.courses.length > 0;

          if (hasCourses) {
            instructions = `
FASE 2: CURSOS ASIGNADOS (B2B)

Los cursos ya están asignados por la organización. NO preguntes qué cursos quiere estudiar.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Presenta los cursos asignados y sus plazos
2. Menciona cuántas lecciones tiene pendientes en cada curso
3. Destaca cualquier curso con plazo próximo (menos de 2 semanas)
4. Sugiere priorizar los cursos con plazos más cercanos
5. Pregunta si está de acuerdo con el orden propuesto
`;
          } else {
            instructions = `
FASE 2: SIN CURSOS ASIGNADOS (B2B)

Este usuario B2B aún no tiene cursos asignados por su organización.

ACCIONES:
1. Informa al usuario que actualmente no tiene cursos asignados
2. Explica que su organización o administrador puede asignarle cursos
3. Ofrece ayudarle a preparar un plan de estudios general o de tiempo
4. Puedes sugerir que se comunique con su administrador para obtener cursos asignados
5. Si el usuario insiste en crear un plan, puedes ayudarle a organizar su tiempo de estudio general
`;
          }
        } else {
          instructions = `
FASE 2: SELECCIÓN DE CURSOS (B2C)

El usuario puede elegir qué cursos incluir en su plan.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Muestra los cursos que ya tiene adquiridos
2. Menciona el progreso actual (lecciones completadas vs pendientes)
3. Pregunta cuáles quiere incluir en el plan
4. OPCIONALMENTE puedes sugerir rutas de aprendizaje personalizadas
5. Puedes mencionar que existen cursos adicionales que podrían complementar su aprendizaje
6. Confirma la selección final de cursos
`;
        }
        break;

      case 3: // Integración de calendario
        instructions = `
FASE 3: CONEXIÓN DE CALENDARIO

Es OBLIGATORIO que el usuario conecte su calendario antes de continuar.

${context.calendarConnected ? `
El usuario ya tiene su calendario conectado (${context.calendarProvider}).
Presenta el análisis de disponibilidad basado en sus eventos.

⚠️ IMPORTANTE: MANEJO DE EVENTOS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), menciona que evitarás esos días
- Pero aclara que el plan CONTINUARÁ distribuyendo lecciones en los días posteriores
- Los días con eventos importantes se saltan, pero el resto del calendario sigue disponible
- Ejemplo: "Veo que tienes un examen el jueves. Evitaré ese día y el viernes para que descanses, pero continuaré con tu plan el sábado."
` : `
El usuario NO tiene calendario conectado.
DEBES pedirle que conecte su Google Calendar o Microsoft Calendar.
Explica que esto permitirá:
- Analizar sus horarios reales
- Evitar conflictos con reuniones
- Sugerir los mejores momentos para estudiar
- Detectar eventos importantes que requieren descanso
`}

ACCIONES:
1. Verificar si tiene calendario conectado
2. Si no está conectado, solicitar la conexión
3. Una vez conectado, analizar la disponibilidad
4. Presentar horarios sugeridos basados en el análisis
5. Si hay eventos importantes, menciona que se evitarán esos días pero se continuará después
`;
        break;

      case 4: // Configuración de tiempos
        instructions = `
FASE 4: CONFIGURACIÓN DE TIEMPOS

Debes configurar los tiempos de las sesiones de estudio.

REGLAS CRÍTICAS:
- El tiempo MÍNIMO de sesión debe ser >= ${context.courseAnalysis?.minimumLessonTime || 15} minutos
  (Este es el tiempo de la lección más corta, el usuario debe completar al menos una lección por sesión)
- Los tiempos deben respetar la disponibilidad del calendario

${isB2B ? `
REGLAS ADICIONALES PARA B2B:
- Los tiempos deben permitir completar los cursos antes de los plazos
- Si el usuario sugiere tiempos que no permiten cumplir los plazos, DEBES advertirle y sugerir alternativas
` : `
OPCIONES PARA B2C:
- Pregunta si quiere establecer metas de tiempo fijas o de finalización
- Si no quiere metas fijas, sugiere tiempos flexibles
- Tiene libertad total para modificar los tiempos que sugieras
`}

ACCIONES:
1. Sugiere tiempos mínimos y máximos de sesión basados en el análisis
2. Pregunta si está de acuerdo o quiere ajustarlos
3. Valida que los tiempos cumplan con las reglas
`;
        break;

      case 5: // Tiempos de descanso
        instructions = `
FASE 5: TIEMPOS DE DESCANSO

Calcula automáticamente los tiempos de descanso óptimos.

MEJORES PRÁCTICAS DE ESTUDIO:
- Técnica Pomodoro: 25 min estudio + 5 min descanso
- Sesiones de 45-60 min: 10-15 min descanso
- Sesiones de 90+ min: 15-20 min descanso

ACCIONES:
1. Basándote en la duración de sesión configurada, sugiere tiempo de descanso
2. Explica brevemente por qué ese tiempo es óptimo
3. El usuario puede ajustarlo si lo desea
`;
        break;

      case 6: // Días y horarios
        instructions = `
FASE 6: DÍAS Y HORARIOS

Configura los días y horarios de estudio.

⚠️ IMPORTANTE: MANEJO DE EVENTOS Y FECHAS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), EVITA asignar lecciones en ese día específico y el día siguiente para descanso
- PERO DEBES CONTINUAR distribuyendo lecciones en todos los demás días disponibles
- NO te detengas después de un evento importante, simplemente sáltalo y sigue con los días posteriores
- Los slots disponibles ya excluyen automáticamente los días con eventos importantes, así que usa TODOS los slots que se te proporcionan

EJEMPLO CORRECTO:
- Día 1: Lección A (normal)
- Día 2: Lección B (normal)
- Día 3: EXAMEN → SALTAR (no asignar lecciones)
- Día 4: → SALTAR (descanso después del examen)
- Día 5: Lección C (CONTINUAR distribuyendo) ✅
- Día 6: Lección D (CONTINUAR distribuyendo) ✅
- ... (seguir hasta completar todas las lecciones)

EJEMPLO INCORRECTO:
- Día 1: Lección A
- Día 2: Lección B
- Día 3: EXAMEN → SALTAR
- Día 4: → SALTAR (descanso)
- Día 5 en adelante: (sin lecciones) ❌ INCORRECTO - NO te detengas aquí

ACCIONES:
1. Pregunta qué días de la semana prefiere estudiar
2. Pregunta en qué horarios:
   - Opción genérica: mañana, tarde, noche
   - Opción específica: hora:minuto exactos
3. Valida que los horarios:
   - No se solapen con eventos del calendario
   - Permitan sesiones de la duración configurada
   - Incluyan los tiempos de descanso
4. Si hay conflictos, sugiere alternativas
5. ASEGÚRATE de distribuir TODAS las lecciones pendientes en los días disponibles
`;
        break;

      case 7: // Resumen y confirmación
        instructions = `
FASE 7: RESUMEN Y CONFIRMACIÓN

Presenta un resumen completo del plan.

⚠️ RECORDATORIO CRÍTICO:
- El plan debe incluir SOLO lecciones pendientes (no completadas)
- Verifica que no estés incluyendo lecciones que el usuario ya completó
- Comienza desde la primera lección no completada de cada curso

⚠️ DISTRIBUCIÓN DE LECCIONES:
- ASEGÚRATE de haber distribuido TODAS las lecciones pendientes en los días disponibles
- Si detectaste eventos importantes (exámenes, presentaciones), solo evita esos días específicos y el día siguiente
- CONTINÚA distribuyendo lecciones en todos los demás días disponibles después del evento
- NO dejes lecciones sin asignar solo porque hay un evento importante en medio del período
- Verifica que el número de lecciones en el plan coincida con el número total de lecciones pendientes

EL RESUMEN DEBE INCLUIR:
- Cursos incluidos y cuántas lecciones pendientes tiene cada uno
- Tiempo mínimo y máximo de sesiones
- Tiempos de descanso
- Días y horarios configurados
- CONFIRMACIÓN de que TODAS las lecciones pendientes fueron distribuidas
${isB2B ? '- Plazos y si se pueden cumplir con la configuración' : '- Meta de finalización (si se configuró)'}

ACCIONES:
1. Presenta el resumen de forma clara
2. Indica si hay advertencias o problemas
3. Ofrece la opción de modificar cualquier aspecto
4. Si el usuario acepta, indica que el plan está listo para guardarse
5. VERIFICA que todas las lecciones pendientes estén distribuidas en el calendario
`;
        break;
    }

    return instructions;
  }

  /**
   * Pre-calcula las sesiones de estudio con horas exactas para evitar errores de aritmética de LIA
   * Este método agrupa lecciones decimales, calcula horas de fin correctamente, y cuenta semanas
   */
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

    // Agrupar lecciones por número base (1 con 1.1, 2 con 2.1, etc.)
    const groupedLessons = this.groupDecimalLessons(lessons);

    // Mapear tiempo de slot
    const slotTimes: Record<string, string> = {
      'mañana': '08:00',
      'tarde': '14:00',
      'noche': '20:00'
    };

    // Mapear días a números (0 = domingo)
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
    let weekNumber = 1;
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

  /**
   * Formatea las sesiones pre-calculadas para incluir en el prompt de LIA
   * LIA solo debe COPIAR este texto, no hacer cálculos
   */
  static formatPreCalculatedSessionsForPrompt(
    preCalculatedData: ReturnType<typeof SofLIAContextService.preCalculateStudySessions>
  ): string {
    if (preCalculatedData.sessions.length === 0) {
      return '';
    }

    let prompt = `\n\n═══════════════════════════════════════════════════════════════════════════════\n`;
    prompt += `📋 PLAN DE ESTUDIO PRE-CALCULADO - LIA DEBE COPIAR EXACTAMENTE ESTOS DATOS\n`;
    prompt += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
    prompt += `⚠️⚠️⚠️ INSTRUCCIÓN CRÍTICA: Los cálculos de hora ya están hechos. NO recalcules.\n`;
    prompt += `Copia EXACTAMENTE las horas de inicio y fin que aparecen aquí.\n\n`;

    // Agrupar por semana
    const byWeek = new Map<number, typeof preCalculatedData.sessions>();
    for (const session of preCalculatedData.sessions) {
      if (!byWeek.has(session.weekNumber)) {
        byWeek.set(session.weekNumber, []);
      }
      byWeek.get(session.weekNumber)!.push(session);
    }

    for (const [weekNum, sessions] of byWeek) {
      const firstDate = sessions[0].date;
      const lastDate = sessions[sessions.length - 1].date;
      prompt += `**Semana ${weekNum} (${firstDate} - ${lastDate}):**\n\n`;

      // Agrupar por día
      const byDay = new Map<string, typeof sessions>();
      for (const session of sessions) {
        if (!byDay.has(session.date)) {
          byDay.set(session.date, []);
        }
        byDay.get(session.date)!.push(session);
      }

      for (const [date, daySessions] of byDay) {
        prompt += `📅 **${daySessions[0].dayName} ${date}:**\n`;
        for (const session of daySessions) {
          prompt += `• ${session.startTime} - ${session.endTime}: Sesión de Estudio (${session.timeSlot.toUpperCase()})\n`;
          for (const lesson of session.lessons) {
            prompt += `  - ${lesson.title} (${lesson.duration} min)\n`;
          }
        }
        prompt += `\n`;
      }
    }

    prompt += `---\n\n`;
    prompt += `✅ **Resumen del plan:**\n`;
    prompt += `- Total de lecciones: ${preCalculatedData.summary.totalLessons}\n`;
    prompt += `- Semanas de estudio: ${preCalculatedData.summary.totalWeeks}\n`;
    prompt += `- Fecha de finalización: ${preCalculatedData.summary.finishDate}\n\n`;
    prompt += `📌 ¿Te parece bien este plan?\n`;

    return prompt;
  }
}
