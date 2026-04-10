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

  if (context.userName) {
    section += '- Usuario activo: ' + context.userName + '\n';
  }

  if (context.organizationName) {
    section += '- Organización del usuario: ' + context.organizationName + '\n';
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

  if (context.userJobTitle || context.userCheck) {
    section += '\n### Perfil Profesional del Usuario (Personalización Obligatoria)\n';

    if (context.userJobTitle) {
      section += '- Cargo Actual: ' + context.userJobTitle + '\n';
      section +=
        'CONTEXTO: El usuario tiene el cargo de: ' +
        context.userJobTitle +
        '. Ten esto en cuenta para dar respuestas relevantes a su nivel, pero NO inicies frases diciendo "Como ' +
        context.userJobTitle +
        '..." a menos que sea estrictamente necesario para el contexto.\n';
    }

    if (context.userCheck?.area) section += '- Área: ' + context.userCheck.area + '\n';
    if (context.userCheck?.companySize)
      section += '- Tamaño Empresa: ' + context.userCheck.companySize + '\n';

    section += '\nINSTRUCCIÓN DE ADAPTACIÓN: El usuario es un profesional en activo.\n';
    section +=
      'Usa su "Cargo Actual" para dar ejemplos de negocios concretos y contextualizar el aprendizaje a su realidad laboral.\n';
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
