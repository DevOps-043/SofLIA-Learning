// ============================================
// INSTRUCCIONES POR CONTEXTO — Rutas business, página activa, actividades, lecciones, metadata
// ============================================

import { PageContextService } from '../../../../lib/lia-context/services/page-context.service';
import type { PlatformContext } from './platform-context.service';

/**
 * Builds the business-routes section when the user is navigating business pages.
 * Returns an empty string when not applicable.
 */
export function buildBusinessRoutesSection(
  context: PlatformContext,
  basePrompt: string
): string {
  if (
    !context.pageType?.startsWith('business_') &&
    !context.currentPage?.includes('/business-panel') &&
    !context.currentPage?.includes('/business-user')
  ) {
    return basePrompt;
  }

  const orgPrefix = context.organizationSlug ? `/${context.organizationSlug}` : '';

  const businessRoutes =
    '## Rutas del Panel de Negocios\n' +
    `- [Dashboard de Negocios](${orgPrefix}/business-panel/dashboard)\n` +
    `- [Jerarquía](${orgPrefix}/business-panel/hierarchy)\n` +
    `- [Catálogo de Cursos](${orgPrefix}/business-panel/courses)\n` +
    `- [Analytics](${orgPrefix}/business-panel/analytics)\n` +
    `- [Configuración](${orgPrefix}/business-panel/settings)`;

  const routesPattern = new RegExp(
    '## Rutas Principales de SofLIA[\\s\\S]*?Talleres disponibles',
    'g'
  );
  return basePrompt.replace(routesPattern, businessRoutes);
}

/**
 * Builds the page-specific instructions section: team detail, interactive activity,
 * current lesson context, system events meta-prompt, and dynamic page metadata.
 */
export function buildPageInstructionsSection(context: PlatformContext): string {
  let section = '';

  if (context.pageType === 'business_team_detail') {
    section += '\n### ESTÁS VIENDO: DETALLE DE EQUIPO (Business Panel)\n';
    section += 'Equipo: "' + context.teamName + '"\n';
    if (context.description) section += 'Descripción: ' + context.description + '\n';
    section += 'Líder: ' + (context.leaderName || 'Sin asignar') + '\n';
    section +=
      'Miembros: ' +
      context.memberCount +
      ' (' +
      (context.activeMemberCount || 0) +
      ' activos)\n';
    section += 'Cursos asignados: ' + (context.coursesCount || 0) + '\n';
    section += 'Pestaña actual: ' + (context.currentTab || 'Resumen') + '\n';

    section += '\nACCIONES DISPONIBLES EN ESTA PÁGINA:\n';
    section += '- Editar información del equipo\n';
    section +=
      '- Gestionar la pestaña actual (' + (context.currentTab || 'General') + ')\n';
    section += '- Asignar nuevos cursos al equipo\n';
    section += '- Ver reporte de progreso detallado\n';

    section +=
      '\nINSTRUCCIÓN: Responde específicamente sobre este equipo. Si te preguntan "qué puedo hacer", sugiere acciones de gestión sobre el equipo "' +
      context.teamName +
      '".\n';
  }

  if (context.currentActivityContext) {
    section += '\n### ACTIVIDAD INTERACTIVA EN CURSO (FOCO PRINCIPAL)\n';
    section +=
      'El usuario está realizando la actividad: "' +
      context.currentActivityContext.title +
      '"\n';
    section += 'Tipo: ' + context.currentActivityContext.type + '\n';
    section +=
      'Descripción/Instrucción: ' + context.currentActivityContext.description + '\n';
    section +=
      '\nTU ROL AHORA: Actúa como mentor guía para esta actividad específica. Ayuda al usuario a completarla, sugiere ideas o evalúa sus respuestas, pero NO la hagas por él completamente. Guíalo.\n';
    section +=
      'IMPORTANTE: Mantén el foco EXCLUSIVAMENTE en la actividad. NO sugieras ir al Dashboard, ni revisar el avance general, ni hables de otros temas. Termina tu intervención con una pregunta o instrucción clara para continuar la actividad.\n';
  }

  if (context.currentLessonContext) {
    section +=
      '\n### CONTEXTO DE LA LECCIÓN ACTUAL (PRIORIDAD MÁXIMA)\n';
    section +=
      'El usuario está viendo activamente la lección: "' +
      (context.currentLessonContext.lessonTitle || 'Lección actual') +
      '"\n';

    if (context.currentLessonContext.description) {
      section += 'Descripción: ' + context.currentLessonContext.description + '\n';
    }

    if (context.currentLessonContext.summary) {
      section += '\nRESUMEN: ' + context.currentLessonContext.summary + '\n';
    }

    if (context.currentLessonContext.transcript) {
      section +=
        '\nTRANSCRIPCIÓN DEL VIDEO (Usa esto para responder preguntas sobre el contenido):\n';
      section += context.currentLessonContext.transcript.substring(0, 30000) + '\n';
    }

    section +=
      '\nINSTRUCCIÓN CRÍTICA: Responde preguntas sobre esta lección basándote EXCLUSIVAMENTE en la transcripción y el resumen proporcionados arriba. Si la respuesta no está en el video, dilo honestamente.\n\n';
  }

  section += '\n\n### INSTRUCCIONES DE SISTEMA INTERNO (META-PROMPT)\n';
  section +=
    'El sistema puede enviarte mensajes especiales que empiezan con "[SYSTEM_EVENT:".\n';
  section +=
    'Si recibes uno, significa que ha ocurrido un evento en la interfaz (como que el usuario inició una actividad).\n';
  section +=
    'TU TAREA: Lee la instrucción dentro del evento y EJECÚTALA dirigiéndote al usuario.\n';
  section +=
    'EJEMPLO: Si el evento dice "Inicia la actividad X", tú dices "¡Hola [Nombre]! Vamos a empezar con la actividad X..."\n';
  section +=
    'NO respondas al evento diciendo "Entendido" o "Procesando evento". Actúa natural, como si el usuario te hubiera pedido empezar.\n';

  if (context.currentPage) {
    try {
      const pageContext = PageContextService.buildPageContext(context.currentPage);
      if (pageContext && !pageContext.includes('No hay metadata')) {
        section += '\n\n' + pageContext;
      }
    } catch (error) {
      console.warn('Error obteniendo contexto de página:', error);
    }
  }

  return section;
}
