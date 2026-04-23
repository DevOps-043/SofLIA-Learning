import type { SessionContext } from '@/lib/rrweb/session-analyzer'
import type { ProactiveHelpResponse } from '../types'

export function createFailedAttemptsResponse(
  sessionContext: SessionContext | null,
): ProactiveHelpResponse {
  return {
    success: true,
    response: `¡Hey! Veo que has intentado varias veces esta actividad. ¡Eso muestra perseverancia! 🎯

He notado los ${sessionContext?.attemptsMade || 3} intentos que has hecho. A menudo, cuando esto pasa, puede ayudar:

• Revisar la estructura del ejemplo dado - compara tu respuesta con el patrón mostrado
• Verificar que estás incluyendo todos los elementos clave (rol, contexto, objetivo)
• Leer la instrucción con más calma - a veces nos saltamos detalles importantes

Basándome en tus intentos, ¿te gustaría que revisemos juntos qué elementos podrían estar faltando?`,
    suggestions: [
      'Compara tu respuesta con el ejemplo dado',
      'Verifica que incluyes: rol, contexto y objetivo',
      'Relee la instrucción paso a paso',
    ],
    resources: [
      {
        title: 'Guía: Cómo estructurar un buen prompt',
        description: 'Aprende las mejores prácticas para crear prompts efectivos',
      },
    ],
  }
}
