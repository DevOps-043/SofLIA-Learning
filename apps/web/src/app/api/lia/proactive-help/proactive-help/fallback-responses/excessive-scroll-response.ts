import type { ProactiveHelpResponse } from '../types'

export function createExcessiveScrollResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response: `Noto que estás buscando información en el material. ¡Esa es una buena estrategia! 📚

Para ayudarte a encontrar lo que necesitas más rápido:

• Usa Ctrl+F (o Cmd+F en Mac) para buscar palabras clave
• Los conceptos más importantes suelen estar en los primeros párrafos de cada sección
• Si buscas un ejemplo específico, fíjate en las secciones marcadas con "Ejemplo:"

¿Hay algo específico que estás buscando? Puedo dirigirte directamente a la sección relevante.`,
    suggestions: [
      'Usa Ctrl+F para buscar palabras clave',
      'Revisa los resúmenes al final de cada sección',
      'Pregúntame directamente sobre el concepto que buscas',
    ],
    resources: [
      {
        title: 'Video: Resumen de conceptos clave',
        description: 'Repaso rápido de los conceptos principales',
      },
    ],
  }
}
