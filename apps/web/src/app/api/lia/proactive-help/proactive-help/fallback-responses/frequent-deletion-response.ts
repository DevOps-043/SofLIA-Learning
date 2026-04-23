import type { ProactiveHelpResponse } from '../types'

export function createFrequentDeletionResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response: `Veo que estás refinando tu respuesta - eso es bueno, significa que estás pensando críticamente! ✏️

Sin embargo, si sientes que no estás seguro de cómo empezar:

• Comienza con una versión simple y mejórala gradualmente
• No te preocupes por la perfección en el primer intento
• Usa el ejemplo como plantilla y personalízalo a tu caso

¿Quieres que veamos juntos un ejemplo similar al que estás intentando crear?`,
    suggestions: [
      'Empieza con una versión simple',
      'Usa el ejemplo como plantilla',
      'Mejora gradualmente en lugar de borrar todo',
    ],
  }
}
