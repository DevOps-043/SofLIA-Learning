import type { StudyPlannerContext } from './lia-context.types';
import type { PreCalculatedSessionsResult } from './lia-prompt-formatter.types';

export class LiaPromptFormatterService {
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
      if (course.assignedBy) {
        prompt += `  - Asignado por: ${course.assignedBy}\n`;
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
          prompt += `  \n  LECCIONES PENDIENTES - USA ESTOS DATOS EXACTOS (nombres, números y duraciones):\n`;
          prompt += `  IMPORTANTE: Copia EXACTAMENTE el número de lección y la duración que aparece aquí.\n`;
          for (const module of course.modules) {
            // Solo mostrar módulos que tengan lecciones pendientes
            const pendingInModule = module.lessons.filter(l => !l.isCompleted);
            if (pendingInModule.length > 0) {
              prompt += `    Módulo ${module.moduleOrderIndex}: ${module.moduleTitle}\n`;
              for (const lesson of pendingInModule) {
                // Usar formato claro: "Lección [NÚMERO]: [TÍTULO] - DURACIÓN: [X] minutos"
                prompt += `       Lección ${lesson.lessonOrderIndex}: ${lesson.lessonTitle} - DURACIÓN: ${lesson.durationMinutes} minutos [PENDIENTE]\n`;
              }
            }
          }
          prompt += `  \n  RECUERDA: Usa el número de lección EXACTO (ej: "Lección 1", "Lección 2", "Lección 3.1") y la duración EXACTA en minutos.\n`;
        }

        prompt += `  \n  RESUMEN: ${completedLessons} de ${totalLessons} lecciones ya completadas, ${pendingLessons} pendientes por planificar\n`;
        prompt += `  \n  IMPORTANTE: El plan de estudios debe incluir SOLO las ${pendingLessons} lecciones pendientes, comenzando desde la primera lección no completada.\n`;
      }
    }

    if (context.courseAnalysis) {
      prompt += `\n## ANÁLISIS DE CURSOS\n`;
      prompt += `- Tiempo total restante: ${Math.round(context.courseAnalysis.totalMinutes / 60 * 10) / 10} horas\n`;
      prompt += `- Lecciones pendientes: ${context.courseAnalysis.totalLessons}\n`;
      prompt += `- Complejidad promedio: ${context.courseAnalysis.averageComplexity}/10\n`;
      prompt += `- Tiempo mínimo por sesión: ${context.courseAnalysis.minimumLessonTime} minutos (para completar al menos una lección)\n`;

      // Análisis inteligente de tipo de curso y duraciones sugeridas
      prompt += `\n## ANÁLISIS INTELIGENTE DEL CURSO\n`;

      // Estadísticas de lecciones
      prompt += `Estadísticas de lecciones:\n`;
      prompt += `- Duración PROMEDIO de lecciones: ${context.courseAnalysis.averageLessonDuration} minutos\n`;
      prompt += `- Duración MÍNIMA: ${context.courseAnalysis.minLessonDuration} minutos\n`;
      prompt += `- Duración MÁXIMA: ${context.courseAnalysis.maxLessonDuration} minutos\n`;

      // Tipo de curso detectado
      const courseTypeLabels = {
        'practical': 'PRÁCTICO/APLICADO',
        'theoretical': 'TEÓRICO/DENSO',
        'mixed': 'MIXTO'
      };
      prompt += `\nTipo de curso detectado: ${courseTypeLabels[context.courseAnalysis.courseType]}\n`;

      // Duraciones de sesión sugeridas
      prompt += `\nDURACIONES DE SESIÓN SUGERIDAS (basadas en el análisis del curso):\n`;
      prompt += `- Sesión CORTA: ${context.courseAnalysis.suggestedSessionDurations.short} minutos\n`;
      prompt += `- Sesión NORMAL: ${context.courseAnalysis.suggestedSessionDurations.normal} minutos\n`;
      prompt += `- Sesión LARGA: ${context.courseAnalysis.suggestedSessionDurations.long} minutos\n`;
      prompt += `\nRazonamiento: ${context.courseAnalysis.suggestedSessionDurations.reasoning}\n`;

      prompt += `\nINSTRUCCIÓN PARA SofLIA: Cuando el usuario seleccione el tipo de sesión, usa las duraciones sugeridas arriba, NO uses valores fijos genéricos como 25/45/60.\n`;
    }

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
      prompt += `\n## PLAZOS PRÓXIMOS\n`;
      for (const deadline of context.upcomingDeadlines) {
        prompt += `- ${deadline.courseTitle}: ${deadline.daysRemaining} días (${deadline.completionPercentage}% completado)\n`;
        if (deadline.daysRemaining < 7) {
          prompt += `  URGENTE: Menos de una semana para completar\n`;
        }
      }
    }

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
   * Formatea las sesiones pre-calculadas para incluir en el prompt de SofLIA
   * SofLIA solo debe COPIAR este texto, no hacer cálculos
   */
  static formatPreCalculatedSessionsForPrompt(
    preCalculatedData: PreCalculatedSessionsResult
  ): string {
    if (preCalculatedData.sessions.length === 0) {
      return '';
    }

    let prompt = `\n\n-------------------------------------------------------------------------------\n`;
    prompt += `PLAN DE ESTUDIO PRE-CALCULADO - SofLIA DEBE COPIAR EXACTAMENTE ESTOS DATOS\n`;
    prompt += `-------------------------------------------------------------------------------\n\n`;
    prompt += `INSTRUCCIÓN CRÍTICA: Los cálculos de hora ya están hechos. NO recalcules.\n`;
    prompt += `Copia EXACTAMENTE las horas de inicio y fin que aparecen aquí.\n\n`;

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

      const byDay = new Map<string, typeof sessions>();
      for (const session of sessions) {
        if (!byDay.has(session.date)) {
          byDay.set(session.date, []);
        }
        byDay.get(session.date)!.push(session);
      }

      for (const [date, daySessions] of byDay) {
        prompt += `${daySessions[0].dayName} ${date}:\n`;
        for (const session of daySessions) {
          prompt += `- ${session.startTime} - ${session.endTime}: Sesión de Estudio\n`;
          for (const lesson of session.lessons) {
            prompt += `  - ${lesson.title} (${lesson.duration} min)\n`;
          }
        }
        prompt += `\n`;
      }
    }

    prompt += `---\n\n`;
    prompt += `Resumen del plan:\n`;
    prompt += `- Total de lecciones: ${preCalculatedData.summary.totalLessons}\n`;
    prompt += `- Semanas de estudio: ${preCalculatedData.summary.totalWeeks}\n`;
    prompt += `- Fecha de finalización: ${preCalculatedData.summary.finishDate}\n\n`;
    prompt += `¿Te parece bien este plan?\n`;

    return prompt;
  }
}
