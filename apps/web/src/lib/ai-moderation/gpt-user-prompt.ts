import type { AIModerationContext } from './types'

export function buildGPTModerationUserPrompt(
  content: string,
  context?: AIModerationContext,
): string {
  const warningContext = context?.previousWarnings
    ? `Contexto: este usuario tiene ${context.previousWarnings} advertencias previas por contenido inapropiado.\n`
    : ''

  return `Analiza este ${context?.contentType || 'contenido'} y determina si es apropiado:

Contenido a analizar:
"${content}"

${warningContext}
Instrucciones:
1. Lee el contenido completo.
2. Identifica palabras ofensivas incluso con numeros.
3. Detecta amenazas explicitas o implicitas.
4. Evalua tono e intencion.
5. Asigna confianza alta si encuentras multiples problemas.

Recuerda: leetspeak y numeros no son excusa. "mu3rt3" = "muerte".`
}
