import type { LessonContext } from './types'

export function buildTabSpecificGuidance(lessonContext: LessonContext): string {
  switch (lessonContext.currentTab) {
    case 'activities':
      return (
        '\n### GUIA ESPECIFICA PARA LA PESTANA ACTIVIDADES\n' +
        '- Si el usuario pregunta "que hago aqui", responde primero que esta en el panel de actividades de esta leccion.\n' +
        '- Explica cuantas actividades y materiales tiene disponibles en esta leccion, y menciona por nombre lo pendiente importante.\n' +
        '- Relaciona cada recomendacion con el video, el resumen y el modulo actual.\n' +
        '- Prioriza la actividad en foco o la siguiente actividad requerida pendiente antes de dar ayuda general.\n'
      )
    case 'video':
      return (
        '\n### GUIA ESPECIFICA PARA LA PESTANA VIDEO\n' +
        '- Interpreta "aqui" como el video y el contenido de la leccion actual.\n' +
        '- Explica el concepto usando la transcripcion y el resumen antes de hablar de la plataforma en general.\n' +
        '- Si ayuda, anticipa las actividades o materiales que el usuario encontrara despues en esta misma leccion.\n'
      )
    case 'questions':
      return (
        '\n### GUIA ESPECIFICA PARA LA PESTANA PREGUNTAS\n' +
        '- Mantente en el contexto de esta leccion y este modulo al responder.\n' +
        '- Si el usuario pide orientacion, sugiere preguntas o dudas concretas sobre el video, materiales y actividades de la leccion actual.\n'
      )
    default:
      return ''
  }
}

export function buildEngagementGuidance(lessonContext: LessonContext): string {
  return (
    '\n### ENGAGEMENT ACTIVO EN LECCIONES:\n' +
    '- Responde la duda y luego haz una pregunta de comprension relacionada.\n' +
    '- Si el usuario dice "no entendi", pregunta primero que parte especifica le genero confusion.\n' +
    '- Conecta los conceptos con situaciones practicas de su entorno profesional cuando sea posible.\n' +
    '- Sugiere que tome notas de los puntos clave cuando aporte valor.\n' +
    buildTabSpecificGuidance(lessonContext)
  )
}
