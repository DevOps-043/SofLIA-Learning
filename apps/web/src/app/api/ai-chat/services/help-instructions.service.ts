/**
 * Help Instructions Service
 * Generates context-specific guidance instructions for detected learning difficulties.
 */

/**
 * Returns a detailed help strategy string for the given difficulty type.
 * The context parameter may contain activitiesContext and userRole fields.
 */
export function generateHelpInstructions(helpType: string, context: Record<string, unknown>): string {
  const activitiesContext = context?.activitiesContext as Record<string, unknown> | undefined;
  const currentActivity = activitiesContext?.currentActivityFocus as Record<string, unknown> | undefined;
  const userRole = context?.userRole as string | undefined;

  const instructions: Record<string, string> = {
    activity_guidance: `
El estudiante está trabajando en una actividad específica pero está inactivo.
${
  currentActivity
    ? `
ACTIVIDAD EN FOCO: "${currentActivity.title}"
- Tipo: ${currentActivity.type}
- Obligatoria: ${currentActivity.isRequired ? 'Sí' : 'No'}
- Descripción: ${currentActivity.description}

ESTRATEGIA DE AYUDA:
1. Reconoce el esfuerzo y la dificultad que puede presentar esta actividad
2. NO des la respuesta directa, pero sí proporciona:
   - Una pista sobre QUÉ buscar en el contenido de la lección
   - Una pregunta guía que le ayude a reflexionar
   - Un ejemplo similar (pero no idéntico) si es apropiado
3. Sugiere revisar secciones específicas de la lección que podrían ayudar
4. Motiva al estudiante a intentarlo de nuevo con las pistas proporcionadas
${userRole ? `5. Adapta el ejemplo al contexto de "${userRole}"` : ''}
`
    : 'Ayuda al estudiante a identificar en qué actividad está trabajando y ofrece orientación general.'
}`,

    content_explanation: `
El estudiante está inactivo en la visualización de contenido (video, transcripción o resumen).
ESTRATEGIA DE AYUDA:
1. Pregunta qué parte del contenido le genera dudas
2. Ofrece un resumen ejecutivo de los puntos clave de la lección
3. Identifica conceptos que podrían ser complejos y ofrece explicaciones simples
4. Sugiere técnicas de estudio activo (tomar notas, hacer preguntas, relacionar con experiencia previa)
${userRole ? `5. Proporciona ejemplos relevantes para alguien en el rol de "${userRole}"` : ''}`,

    content_navigation: `
El estudiante está haciendo scroll excesivo, lo que indica que busca información específica.
ESTRATEGIA DE AYUDA:
1. Pregunta directamente QUÉ está buscando
2. Proporciona un índice o mapa del contenido de la lección con timestamps/secciones
3. Identifica las secciones clave donde podría encontrar lo que busca
4. Sugiere usar Ctrl+F o la función de búsqueda si aplica`,

    activity_hints: `
El estudiante ha fallado múltiples intentos en una actividad.
${
  currentActivity
    ? `
ACTIVIDAD CON DIFICULTADES: "${currentActivity.title}"

ESTRATEGIA DE AYUDA PROGRESIVA:
1. PRIMER NIVEL - Pista general:
   - Indica el concepto o sección de la lección que contiene la respuesta
   - Formula una pregunta guía que le ayude a pensar en la dirección correcta

2. SEGUNDO NIVEL - Pista específica (si sigue con problemas):
   - Proporciona un ejemplo paralelo que ilustre el concepto
   - Desglosa la actividad en pasos más pequeños

3. TERCER NIVEL - Casi la respuesta (solo si ya ha intentado con las pistas anteriores):
   - Da la estructura o formato de la respuesta esperada
   - Indica qué elementos debe incluir, pero sin darle el contenido exacto

4. MOTIVACIÓN CONSTANTE:
   - Refuerza que la dificultad es normal y parte del proceso de aprendizaje
   - Celebra el esfuerzo y la persistencia
${userRole ? `   - Conecta la importancia de esta actividad con su rol como "${userRole}"` : ''}
`
    : 'Ayuda al estudiante a identificar qué actividad está causando problemas.'
}`,

    activity_structure: `
El estudiante está escribiendo y borrando frecuentemente, lo que indica inseguridad sobre cómo estructurar su respuesta.

ESTRATEGIA DE AYUDA:
1. Proporciona una plantilla o estructura clara de cómo debería organizarse la respuesta
2. Da ejemplos del formato esperado (lista de puntos, párrafos, tabla, etc.)
3. Indica la longitud aproximada esperada
4. Sugiere un enfoque paso a paso para construir la respuesta
${currentActivity ? `5. Para la actividad "${currentActivity.title}", específicamente sugiere cómo organizar las ideas` : ''}`,

    concept_clarification: `
El estudiante está navegando repetitivamente entre secciones, indicando confusión conceptual.

ESTRATEGIA DE AYUDA:
1. Identifica cuál podría ser el concepto central que genera confusión
2. Explica el concepto de manera simple, usando analogías cotidianas
3. Conecta cómo las diferentes partes de la lección se relacionan entre sí
4. Crea un "mapa conceptual" textual que muestre las relaciones
5. Sugiere un orden lógico para revisar el material
${userRole ? `6. Usa ejemplos del mundo "${userRole}" para ilustrar los conceptos` : ''}`,

    interface_guidance: `
El estudiante ha hecho clicks sin resultado, indicando problemas de navegación o uso de la interfaz.

ESTRATEGIA DE AYUDA:
1. Explica cómo navegar correctamente por la plataforma de aprendizaje
2. Indica dónde encontrar las diferentes pestañas (video, transcripción, resumen, actividades)
3. Explica cómo completar y enviar actividades
4. Sugiere usar el botón de ayuda o tutoriales de la plataforma si están disponibles`,

    general: `
El estudiante ha solicitado ayuda general o el sistema detectó dificultades no específicas.

ESTRATEGIA DE AYUDA GENERAL:
1. Haz preguntas diagnósticas abiertas:
   - "¿En qué parte de la lección sientes que necesitas más apoyo?"
   - "¿Hay algún concepto específico que no te quede claro?"
   - "¿Estás trabajando en alguna actividad en particular?"

2. Proporciona un resumen de lo que cubre la lección actual

3. Ofrece múltiples tipos de ayuda:
   - Explicación de conceptos
   - Ayuda con actividades
   - Orientación de navegación

4. Mantén un tono cálido, paciente y motivador
${userRole ? `5. Ten en cuenta que el estudiante tiene el rol de "${userRole}" al dar ejemplos` : ''}`,
  };

  return instructions[helpType] ?? instructions['general'];
}
