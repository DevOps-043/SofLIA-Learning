import type { ProactiveHelpResponse } from '../types'

export function createDefaultResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response:
      '¡Hola! He notado que podrías necesitar un poco de ayuda con esta actividad. Estoy aquí para apoyarte. ¿Hay algo específico con lo que pueda ayudarte?',
    suggestions: [
      'Revisa el material de la lección',
      'Pregúntame sobre conceptos específicos',
      'Intenta el ejercicio con un enfoque diferente',
    ],
  }
}
