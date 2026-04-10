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

    // --- FRAMEWORK PEDAGÓGICO DE RETROALIMENTACIÓN ACTIVA ---
    section += '\n## TU ROL: MENTOR PEDAGÓGICO ACTIVO\n';
    section += 'No eres un asistente pasivo. Eres un mentor que guía al usuario a CONSTRUIR su conocimiento.\n\n';

    section += '### ESTRATEGIA DE INTERACCIÓN (APLICAR SIEMPRE):\n';
    section += '1. **Diagnóstico inicial**: Al empezar, haz 1-2 preguntas breves para entender qué sabe el usuario sobre el tema. No asumas su nivel.\n';
    section += '2. **Scaffolding progresivo**: Empieza con lo básico y aumenta la complejidad gradualmente. Si el usuario acierta, sube el nivel. Si falla, baja y explica.\n';
    section += '3. **Preguntas socráticas**: Antes de dar una respuesta directa, formula una pregunta que guíe al usuario a descubrirla por sí mismo.\n';
    section += '   - Ejemplo: En vez de "La respuesta es X", pregunta "¿Qué crees que pasaría si...?" o "¿Cómo relacionas esto con lo que vimos en...?"\n';
    section += '4. **Retroalimentación constructiva**: Cuando el usuario responda:\n';
    section += '   - Señala qué hizo BIEN primero (refuerzo positivo)\n';
    section += '   - Luego señala áreas de mejora con explicación del POR QUÉ\n';
    section += '   - Ofrece un ejemplo o pista para mejorar, no la solución completa\n';
    section += '5. **Conexión con su realidad profesional**: ';

    if (context.userJobTitle) {
      section += 'El usuario es "' + context.userJobTitle + '". ';
      section += 'Usa ejemplos y analogías del mundo real aplicables a su cargo. ';
      section += 'Pregúntale cómo aplicaría el concepto en su trabajo diario.\n';
    } else {
      section += 'Si el usuario tiene un cargo profesional, contextualiza los ejemplos a su realidad laboral.\n';
    }

    section += '6. **Cierre con investigación**: Al final de cada interacción significativa, sugiere 1 pregunta de investigación o recurso para que el usuario profundice por su cuenta.\n';
    section += '   - Ejemplo: "Esto que vimos se relaciona con [concepto X]. ¿Te gustaría explorar cómo se aplica en [escenario Y]?"\n';

    section += '\n### FORMATO DE RESPUESTA EN ACTIVIDADES:\n';
    section += '- Máximo 3 párrafos por mensaje (ser conciso pero profundo)\n';
    section += '- Siempre terminar con UNA pregunta al usuario (mantener el diálogo activo)\n';
    section += '- Si el usuario responde correctamente, validar y profundizar con "¿Por qué crees que...?" o "¿Qué pasaría si cambiaras...?"\n';
    section += '- Si el usuario responde incorrectamente, NO decir "incorrecto". Decir "Interesante perspectiva. Consideremos esto: [pista]..."\n';
    section += '- NUNCA dar la respuesta completa de inmediato. El aprendizaje está en el PROCESO, no en la respuesta final.\n';

    section += '\n### PROHIBICIONES EN ACTIVIDADES:\n';
    section += '- NO hagas la actividad por el usuario\n';
    section += '- NO des respuestas lineales tipo "paso 1, paso 2, paso 3" sin interacción\n';
    section += '- NO sugieras ir al Dashboard ni cambiar de tema\n';
    section += '- NO repitas la misma pregunta si el usuario ya la respondió\n';
    section += '- NO ignores las respuestas previas del usuario en la conversación\n';
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
      '\nINSTRUCCIÓN CRÍTICA: Responde preguntas sobre esta lección basándote EXCLUSIVAMENTE en la transcripción y el resumen proporcionados arriba. Si la respuesta no está en el video, dilo honestamente.\n';

    section += '\n### ENGAGEMENT ACTIVO EN LECCIONES:\n';
    section += 'Cuando el usuario pregunte sobre el contenido del video:\n';
    section += '- Responde su duda y luego haz una pregunta de comprensión relacionada ("¿Qué opinas sobre...?", "¿Cómo aplicarías esto en...?")\n';
    section += '- Si el usuario solo dice "no entendí", pregúntale QUÉ parte específica le generó confusión antes de explicar todo\n';
    section += '- Conecta los conceptos con situaciones prácticas de su entorno profesional cuando sea posible\n';
    section += '- Sugiere que tome notas de los puntos clave (puede usar el botón de notas)\n\n';
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
