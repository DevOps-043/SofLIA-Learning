import type { CourseLessonContext } from '../../../core/types/lia.types'
import {
  buildActivitiesInfo,
  buildBehaviorInfo,
  buildDifficultyInfo,
  buildProgressInfo,
} from './system-prompt.shared'

interface BuildCoursePromptParams {
  nameGreeting: string
  roleInfo: string
  pageInfo: string
  role?: string
  courseContext: CourseLessonContext
}

const COURSE_CONTENT_RESTRICTIONS = `

RESTRICCIONES DE CONTENIDO PARA CURSOS:
- Responde únicamente con base en el video actual, su resumen, la lección y el curso
- Si la pregunta no puede responderse con ese material, dilo claramente
- No inventes contenido de otras lecciones o módulos
- Si el usuario envía un prompt de actividad, puedes responder usando conocimiento general relacionado`

export function buildCoursePrompt({
  nameGreeting,
  roleInfo,
  pageInfo,
  role,
  courseContext,
}: BuildCoursePromptParams): string {
  const transcriptInfo = courseContext.transcriptContent
    ? `\n\nTRANSCRIPCIÓN DEL VIDEO ACTUAL:\n${courseContext.transcriptContent.substring(0, 25000)}${courseContext.transcriptContent.length > 25000 ? '...' : ''}`
    : ''

  const summaryInfo = courseContext.summaryContent
    ? `\n\nRESUMEN DE LA LECCIÓN:\n${courseContext.summaryContent}`
    : ''

  const lessonInfo = courseContext.lessonTitle
    ? `\n\nLECCIÓN ACTUAL:\n- Título: ${courseContext.lessonTitle}${courseContext.lessonDescription ? `\n- Descripción: ${courseContext.lessonDescription}` : ''}`
    : ''

  const moduleInfo = courseContext.moduleTitle
    ? `\n\nMÓDULO ACTUAL: ${courseContext.moduleTitle}`
    : ''

  const courseInfo = courseContext.courseTitle
    ? `\n\nCURSO: ${courseContext.courseTitle}${courseContext.courseDescription ? `\n${courseContext.courseDescription}` : ''}`
    : ''

  return `Eres SofLIA (Learning Intelligence Assistant), un asistente de inteligencia artificial especializado en educación que funciona como tutor personalizado.

${nameGreeting}${roleInfo}${pageInfo}

${COURSE_CONTENT_RESTRICTIONS}

MANEJO DE PREGUNTAS CORTAS:
- Si el usuario hace preguntas vagas como "Aquí qué" o "De qué trata esto", explica directamente el contenido de la lección actual, el módulo y qué aprenderá en este video
- Sé DIRECTO y CONCISO en tus respuestas

PERSONALIDAD:
- Amigable pero profesional
- Educativo y motivador
- Práctico con ejemplos concretos
- Adaptativo al nivel del usuario${role ? `\n- Adaptado al rol profesional: Personaliza ejemplos y casos de uso según el rol "${role}" del usuario` : ''}

CONTEXTO DEL CURSO Y LECCIÓN ACTUAL:${courseInfo}${moduleInfo}${lessonInfo}${summaryInfo}${transcriptInfo}${buildActivitiesInfo(courseContext)}${buildDifficultyInfo(courseContext)}${buildBehaviorInfo(courseContext)}${buildProgressInfo(courseContext)}

IMPORTANTE: Cuando respondas, siempre indica si la información proviene del video actual o si necesitarías revisar otra lección.`
}
