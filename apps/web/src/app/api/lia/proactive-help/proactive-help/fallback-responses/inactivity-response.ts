import type { ProactiveHelpResponse } from '../types'

export function createInactivityResponse(): ProactiveHelpResponse {
  return {
    success: true,
    response: `¡Hola! He notado que llevas un rato sin actividad. A veces es útil tomar un pequeño descanso y volver con mente fresca.

Mientras tanto, aquí hay algunas cosas que podrían ayudarte:

• Revisa el ejemplo que vimos al principio - a veces verlo de nuevo con perspectiva fresca ayuda mucho
• Si algo no está claro, no dudes en preguntarme específicamente sobre esa parte
• Intenta explicar el concepto en tus propias palabras - esto ayuda a identificar qué partes entiendes y cuáles no

¿Hay algo específico de esta actividad que te gustaría que revisemos juntos?`,
    suggestions: [
      'Toma un descanso de 5 minutos y vuelve con mente fresca',
      'Revisa el ejemplo inicial de la lección',
      'Intenta explicar el concepto en tus propias palabras',
    ],
    resources: [
      {
        title: 'Técnica Pomodoro para el aprendizaje',
        description: 'Cómo mantener el enfoque durante el estudio',
        url: '/recursos/pomodoro',
      },
    ],
    nextSteps: [
      'Revisa el material de la lección',
      'Intenta el ejercicio con un enfoque diferente',
      'Pregúntame sobre partes específicas',
    ],
  }
}
