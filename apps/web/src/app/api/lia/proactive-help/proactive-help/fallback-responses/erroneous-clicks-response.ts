import type { ProactiveHelpResponse } from '../types'

export function createErroneousClicksResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response: `He notado algunos clicks que no parecen estar respondiendo. A veces la interfaz puede ser un poco confusa.

Algunas cosas que puedes intentar:

• Refresca la página si un botón no responde
• Verifica que hayas completado todos los campos requeridos antes de enviar
• Si algo no funciona, házmelo saber - puedo guiarte por un camino alternativo

¿Hay algún botón o función específica que no esté funcionando como esperabas?`,
    suggestions: [
      'Refresca la página si algo no responde',
      'Verifica completar todos los campos',
      'Prueba con un navegador diferente si persiste',
    ],
  }
}
