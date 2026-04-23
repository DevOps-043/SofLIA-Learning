import type { ProactiveHelpResponse } from '../types'

export function createRepetitiveCyclesResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response: `Noto que has vuelto atrás varias veces. Esto puede indicar que algo no quedó claro en una sección anterior.

Te sugiero:

• Identificar exactamente qué concepto te genera dudas
• Revisar ese concepto específico con más calma
• Preguntarme sobre esa parte en particular

¿Qué sección te gustaría que repasemos con más detalle?`,
    suggestions: [
      'Identifica qué concepto específico te confunde',
      'Revisa solo esa sección con más atención',
      'Pregúntame sobre ese concepto en particular',
    ],
  }
}
