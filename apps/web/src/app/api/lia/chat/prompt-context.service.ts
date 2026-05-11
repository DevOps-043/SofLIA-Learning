// ============================================
// INYECCIÓN DE CONTEXTO DINÁMICO — Datos del usuario, cursos, progreso de lecciones
// ============================================

import type { PlatformContext } from './platform-context.service';

/**
 * Builds the user-data section of the prompt: org slug routes, profile,
 * platform stats, enrolled courses, lesson progress, and assigned courses.
 */
export function buildUserContextSection(context: PlatformContext): string {
  let section = '';

  const orgPrefix = context.organizationSlug ? '/' + context.organizationSlug : '';

  section += '\n### FUENTE DE VERDAD: Datos verificados desde la base de datos de SofLIA\n';
  section += 'REGLA ABSOLUTA: Si un dato aparece en esta sección, es el valor oficial y verificado. NUNCA lo contradigas ni lo mezcles con suposiciones o datos de sesiones anteriores.\n';
  section += 'SEPARACIÓN OBLIGATORIA: El cargo del usuario es su rol profesional en su empresa. El nombre de la organización es el de su empleador. NO mezcles estos conceptos entre sí ni con el rol técnico dentro de la plataforma (Admin, BusinessUser, etc.).\n\n';

  if (context.userName) {
    section += '- Usuario activo: ' + context.userName + '\n';
  }

  if (context.organizationName) {
    section += '- Organización empleadora del usuario: ' + context.organizationName + '\n';
    section +=
      'IMPORTANTE: El usuario pertenece a la organización "' +
      context.organizationName +
      '". Menciona este nombre explícitamente cuando hables sobre su dashboard o entorno de trabajo.\n';
  }

  if (context.organizationSlug) {
    section += '- Slug de organización: ' + context.organizationSlug + '\n';
    section +=
      'INSTRUCCIÓN CRÍTICA PARA RUTAS: Cuando sugieras rutas de business-panel o business-user, SIEMPRE usa el prefijo /' +
      context.organizationSlug +
      '/ antes de business-panel o business-user.\n';
    section +=
      'Ejemplo correcto: [Dashboard](/' +
      context.organizationSlug +
      '/business-user/dashboard)\n';
    section +=
      'Ejemplo correcto: [Panel Admin](/' +
      context.organizationSlug +
      '/business-panel/dashboard)\n';
    section +=
      'NUNCA uses /business-panel/... o /business-user/... sin el slug de organización.\n';
  }

  const hasOrgContext = context.organizationIndustry || context.organizationSize ||
    context.organizationType || context.organizationMission || context.organizationCountry;

  if (hasOrgContext) {
    section += '\n### Perfil de la Empresa (Contexto Organizacional)\n';
    section +=
      'INSTRUCCIÓN: Usa esta información para contextualizar TODOS los ejemplos, casos de uso y recomendaciones a la realidad específica de la empresa del usuario.\n';

    if (context.organizationIndustry) {
      section += '- Sector / Giro: ' + context.organizationIndustry + '\n';
    }
    if (context.organizationSize) {
      section += '- Tamaño de la empresa: ' + context.organizationSize + ' empleados\n';
      section +=
        'CONTEXTO DE ESCALA: Adapta la complejidad y escala de los ejemplos al tamaño real de la organización. ' +
        'Una empresa de ' + context.organizationSize + ' empleados tiene dinámicas, procesos y desafíos muy distintos a empresas de otro tamaño.\n';
    }
    if (context.organizationType) {
      section += '- Modelo de negocio: ' + context.organizationType + '\n';
    }
    if (context.organizationCountry) {
      section += '- País de operación: ' + context.organizationCountry + '\n';
    }
    if (context.organizationMission) {
      section += '- Misión / Propósito: ' + context.organizationMission + '\n';
      section +=
        'CONTEXTO: La misión de la empresa define el propósito detrás del trabajo del usuario. ' +
        'Úsala para dar ejemplos que conecten el aprendizaje con el impacto real en la organización.\n';
    }

    section += '\nINSTRUCCIÓN DE CONTEXTUALIZACIÓN EMPRESARIAL:\n';
    section +=
      'Cuando el usuario aprenda un concepto, siempre da ejemplos concretos aplicados a:\n';
    section += '1. El sector específico (' + (context.organizationIndustry || 'su industria') + ')\n';
    section += '2. La escala de la empresa (' + (context.organizationSize ? context.organizationSize + ' empleados' : 'su tamaño') + ')\n';
    section += '3. El tipo de clientes que sirve (' + (context.organizationType || 'su modelo de negocio') + ')\n';
    section += 'NUNCA des ejemplos genéricos cuando tengas contexto empresarial disponible.\n';
  }

  // NOTE: User job title and description are injected by buildUniversalUserRoleSection
  // (in prompt-instructions.service.ts) which is assembled earlier in the prompt.
  // Do NOT repeat them here — duplication confuses the model.
  // Only include supplemental user context that is NOT covered there.
  if (context.userCheck?.area) {
    section += '\n- Área funcional del usuario (complementario): ' + context.userCheck.area + '\n';
  }
  // userCheck.companySize is suppressed when organizationSize is available (DB wins).
  if (context.userCheck?.companySize && !context.organizationSize) {
    section += '- Tamaño de empresa (declarado por usuario): ' + context.userCheck.companySize + '\n';
  }

  if (context.currentPage) {
    section += '- Página actual: ' + context.currentPage + '\n';
  }

  section += '\n### Estadísticas Generales de SOFLIA:\n';
  section += '- Total de cursos activos: ' + (context.totalCourses || 'N/A') + '\n';
  section += '- Total de usuarios: ' + (context.totalUsers || 'N/A') + '\n';
  section += '- Organizaciones registradas: ' + (context.totalOrganizations || 'N/A') + '\n';

  if (context.userCourses && context.userCourses.length > 0) {
    section +=
      '\n### Cursos en los que está inscrito ' + (context.userName || 'el usuario') + ':\n';
    context.userCourses.forEach(course => {
      section +=
        '- ' +
        course.title +
        ' (' +
        course.progress +
        '% completado) - Accede desde tu [Dashboard](' +
        orgPrefix +
        '/business-user/dashboard)\n';
    });
  }

  if (context.userLessonProgress && context.userLessonProgress.length > 0) {
    section +=
      '\n### PROGRESO DE LECCIONES DEL USUARIO (ordenadas por última acceso):\n';
    section +=
      'IMPORTANTE: Usa esta información para saber en qué lección sigue el usuario.\n\n';

    const inProgressLesson = context.userLessonProgress.find(
      lp => !lp.isCompleted && lp.status === 'in_progress'
    );
    const nextLesson = context.userLessonProgress.find(lp => lp.status === 'not_started');

    if (inProgressLesson) {
      section += 'LECCIÓN EN PROGRESO (continuar aquí):\n';
      section +=
        '   - ' +
        inProgressLesson.lessonTitle +
        ' (Módulo ' +
        inProgressLesson.moduleOrder +
        ': ' +
        inProgressLesson.moduleName +
        ')\n';
      section += '   - Curso: ' + inProgressLesson.courseName + '\n';
      section += '   - Video visto: ' + (inProgressLesson.videoProgress || 0) + '%\n';
      section +=
        '   - Tiempo dedicado: ' + (inProgressLesson.timeSpentMinutes || 0) + ' minutos\n';
      section +=
        '   - Acceso: Desde el [Dashboard](' + orgPrefix + '/business-user/dashboard)\n\n';
    }

    if (nextLesson && !inProgressLesson) {
      section += 'SIGUIENTE LECCIÓN SUGERIDA:\n';
      section += '   - ' + nextLesson.lessonTitle + ' (' + nextLesson.moduleName + ')\n';
      section += '   - Curso: ' + nextLesson.courseName + '\n\n';
    }

    section += 'Historial de lecciones del usuario:\n';
    context.userLessonProgress.forEach(lp => {
      let statusSymbol = '[pendiente]';
      let statusText = 'No iniciada';

      if (lp.isCompleted) {
        statusSymbol = '[completada]';
        statusText = 'Completada';
      } else if (lp.status === 'in_progress') {
        statusSymbol = '[en progreso]';
        statusText = 'En progreso (' + (lp.videoProgress || 0) + '% video)';
      }

      section +=
        statusSymbol +
        ' Lección ' +
        lp.lessonOrder +
        ': "' +
        lp.lessonTitle +
        '" - ' +
        statusText +
        '\n';
      section += '   Módulo: ' + lp.moduleName + ' | Curso: ' + lp.courseName + '\n';
      if (lp.lessonDescription) {
        section += '   Descripción: ' + lp.lessonDescription + '\n';
      }
    });
  }

  if (context.coursesWithContent && context.coursesWithContent.length > 0) {
    section += '\n### CURSOS ASIGNADOS AL USUARIO (SOLO ESTOS PUEDE VER):\n';
    section +=
      'RESTRICCIÓN CRÍTICA: El usuario SOLO tiene acceso a los cursos listados abajo.\n';
    section +=
      'NUNCA menciones, recomiendes ni enlaces a cursos que NO estén en esta lista.\n';
    section += 'NUNCA uses enlaces a /courses/[slug] - esas rutas NO existen.\n';
    section +=
      'Si el usuario pregunta por un curso que no está aquí, dile que no lo tiene asignado.\n\n';

    context.coursesWithContent.forEach(
      (course: Record<string, unknown>, courseIndex: number) => {
        section += 'CURSO ' + (courseIndex + 1) + ': ' + course.title + '\n';
        section +=
          '   - Descripción: ' + (course.description || 'Sin descripción') + '\n';
        section += '   - Nivel: ' + (course.level || 'N/A') + '\n';
        section +=
          '   - Duración: ' + (course.durationMinutes || 0) + ' minutos\n';
        section +=
          '   - Acceso: Desde el [Dashboard](' +
          orgPrefix +
          '/business-user/dashboard)\n\n';
      }
    );
  } else if (context.noCoursesAssigned) {
    section += '\n### CURSOS ASIGNADOS AL USUARIO:\n';
    section += 'El usuario NO tiene cursos asignados actualmente.\n';
    section +=
      'Si pregunta por cursos, infórmale que debe esperar a que su organización le asigne formación.\n';
    section +=
      'NUNCA recomiendes cursos ni enlaces a /courses/ - esas rutas NO existen.\n\n';
  }

  return section;
}
