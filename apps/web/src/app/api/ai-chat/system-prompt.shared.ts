import type { CourseLessonContext } from '../../../core/types/lia.types'
import type { PageContext, SupportedLanguage } from './system-prompt.types'
import { generateHelpInstructions } from './services/help-instructions.service'

export const URL_INSTRUCTIONS = `
  
INSTRUCCIONES PARA PROPORCIONAR URLs Y NAVEGACIÓN:
- Cuando sugieras navegar a otra página, SIEMPRE proporciona la URL completa con formato de hipervínculo
- Formato: [texto del enlace](URL_completa)
- Ejemplo: Puedes ver todos los cursos disponibles en [Dashboard](/dashboard)
- IMPORTANTE: Para ver TODOS los cursos disponibles, usa [Dashboard](/dashboard), NO /courses
- La ruta /courses/[slug] es solo para ver el detalle de un curso específico, no para ver el catálogo completo
- Para URLs dinámicas, usa el formato: [Ver curso](/courses/[slug]) donde [slug] debe ser reemplazado por el slug real del curso
- SIEMPRE verifica que la ruta existe en el contexto de la plataforma antes de sugerirla
- Si no estás seguro de una ruta, sugiere la página más cercana que conozcas del contexto de la plataforma

REGLA DE ORO:
- Cuando el usuario pida ir a algún lugar, el enlace DEBE estar en tu PRIMERA respuesta
- NUNCA le pidas que busque en menús o que navegue manualmente
- SIEMPRE usa los LINKS DISPONIBLES proporcionados en el contexto`

export const FORMAT_INSTRUCTIONS = `

FORMATO DE RESPUESTAS (CRÍTICO):
- Escribe SIEMPRE en texto plano sin ningún tipo de formato markdown (EXCEPTO para enlaces)
- NUNCA uses asteriscos (*) para negritas o énfasis
- NUNCA uses guiones bajos (_) para cursivas
- NUNCA uses almohadillas (#) para títulos
- Para enfatizar usa MAYÚSCULAS o palabras como "muy", "importante", "especial"
- Para listas usa guiones simples (-)
- Para numeración usa números seguidos de punto (1., 2., 3.)
- ✅ Para enlaces, SIEMPRE usa el formato [texto del enlace](URL). Este es el ÚNICO formato Markdown permitido`

export const CONTENT_RESTRICTIONS = `

RESTRICCIONES DE CONTENIDO ABSOLUTAS:
- Responde solo sobre la plataforma SofLIA, cursos, talleres, IA aplicada, herramientas tecnológicas educativas y navegación
- Si la pregunta está fuera de ese alcance, recházala con la respuesta estándar segura
- Ante duda, prioriza rechazar antes que salirte del propósito educativo`

export function buildLanguageNote(language: SupportedLanguage): string {
  if (language === 'en') {
    return "CRITICAL LANGUAGE INSTRUCTION: The user is speaking in ENGLISH. You MUST respond strictly in ENGLISH."
  }

  if (language === 'pt') {
    return 'INSTRUÇÃO CRÍTICA DE IDIOMA: O usuário está falando em PORTUGUÊS. Você DEVE responder estritamente em PORTUGUÊS.'
  }

  return 'INSTRUCCIÓN CRÍTICA DE IDIOMA: El usuario está hablando en ESPAÑOL. Debes responder estrictamente en ESPAÑOL.'
}

export function buildVoiceLanguageInstruction(language: SupportedLanguage): string {
  if (language === 'en') {
    return "CRITICAL: The user just spoke to you in ENGLISH. You MUST respond ONLY in ENGLISH."
  }

  if (language === 'pt') {
    return 'CRÍTICO: O usuário acabou de falar com você em PORTUGUÊS. Você DEVE responder APENAS em PORTUGUÊS.'
  }

  return 'CRÍTICO: El usuario acaba de hablarte en ESPAÑOL. Debes responder SOLO en ESPAÑOL.'
}

export function buildNameGreeting(userName?: string): string {
  return userName && userName !== 'usuario'
    ? `INFORMACIÓN DEL USUARIO:
- El nombre del usuario es: ${userName}
- NO uses el nombre del usuario en tus respuestas
- NO saludes con "Hola", "Hi", "Bienvenido", etc.
- Responde de forma directa y natural sin saludos ni nombres`
    : ''
}

export function buildRoleInfo(role?: string): string {
  return role
    ? `\n\nROL PROFESIONAL DEL USUARIO:
- El usuario tiene el rol profesional: "${role}"
- DEBES adaptar tus respuestas, ejemplos y casos de uso a ese contexto profesional`
    : ''
}

export function buildPageInfo(pageContext?: PageContext): string {
  if (!pageContext) {
    return ''
  }

  let pageInfo = `\n\nCONTEXTO DE LA PÁGINA ACTUAL:\n- URL: ${pageContext.pathname}\n- Área: ${pageContext.detectedArea}\n- Descripción base: ${pageContext.description}`

  if (pageContext.pageTitle) {
    pageInfo += `\n- Título de la página: "${pageContext.pageTitle}"`
  }

  if (pageContext.metaDescription) {
    pageInfo += `\n- Descripción meta: "${pageContext.metaDescription}"`
  }

  if (pageContext.detectedArea === 'study-planner' && pageContext.userContext) {
    const userContext = pageContext.userContext

    if (userContext.calendarConnected) {
      pageInfo += `\n- ESTADO DEL CALENDARIO: CONECTADO (${userContext.calendarProvider || 'desconocido'})`
    } else {
      pageInfo += '\n- ESTADO DEL CALENDARIO: NO CONECTADO'
    }

    if (userContext.hasCalendarAnalyzed) {
      pageInfo += '\n- El calendario ya fue analizado y se dieron recomendaciones de horarios'
    }

    if (userContext.hasRecommendedSchedules) {
      pageInfo += '\n- Ya se proporcionaron metas semanales y horarios recomendados'
    }

    if (userContext.targetDate) {
      pageInfo += `\n- FECHA LÍMITE ESTABLECIDA: ${userContext.targetDate}`
      pageInfo += '\n- REGLA ABSOLUTA: NUNCA generar horarios después de esta fecha'
    }
  }

  if (pageContext.headings?.length) {
    pageInfo += `\n- Encabezados principales: ${pageContext.headings.map(heading => `"${heading}"`).join(', ')}`
  }

  if (pageContext.mainText) {
    pageInfo += `\n- Contenido visible en la página:\n"${pageContext.mainText}"`
  }

  if (pageContext.platformContext) {
    pageInfo += `\n\n${pageContext.platformContext}`
  }

  if (pageContext.availableLinks) {
    pageInfo += `\n\n${pageContext.availableLinks}`
  }

  return pageInfo
}

export function buildActivitiesInfo(courseContext?: CourseLessonContext): string {
  if (!courseContext?.activitiesContext) {
    return ''
  }

  const activitiesContext = courseContext.activitiesContext
  const currentActivity = activitiesContext.currentActivityFocus

  return `\n\nINFORMACIÓN DE ACTIVIDADES DE LA LECCIÓN:
- Total de actividades: ${activitiesContext.totalActivities}
- Actividades obligatorias: ${activitiesContext.requiredActivities}
- Actividades completadas: ${activitiesContext.completedActivities}
- Actividades obligatorias pendientes: ${activitiesContext.pendingRequiredCount}${activitiesContext.pendingRequiredTitles ? `\n- Pendientes: ${activitiesContext.pendingRequiredTitles}` : ''}${currentActivity ? `\n- Actividad actual: "${currentActivity.title}" (${currentActivity.type})` : ''}`
}

export function buildDifficultyInfo(courseContext?: CourseLessonContext): string {
  if (!courseContext?.difficultyDetected) {
    return ''
  }

  return `\n\nCONTEXTO DE AYUDA PROACTIVA:
${courseContext.difficultyDetected.patterns.map(pattern => `- ${pattern.description}`).join('\n')}
- Tipo de ayuda sugerida: ${courseContext.difficultyDetected.suggestedHelpType || 'general'}
${generateHelpInstructions(
  courseContext.difficultyDetected.suggestedHelpType || 'general',
  courseContext as unknown as Record<string, unknown>
)}`
}

export function buildBehaviorInfo(courseContext?: CourseLessonContext): string {
  return courseContext?.userBehaviorContext
    ? `\n\nANÁLISIS DE COMPORTAMIENTO DEL ESTUDIANTE:\n${courseContext.userBehaviorContext}`
    : ''
}

export function buildProgressInfo(courseContext?: CourseLessonContext): string {
  return courseContext?.learningProgressContext
    ? `\n\nPROGRESO DEL ESTUDIANTE:
- Lección actual: ${courseContext.learningProgressContext.currentLessonNumber} de ${courseContext.learningProgressContext.totalLessons} (${courseContext.learningProgressContext.progressPercentage}% completado)
- Pestaña actual: ${courseContext.learningProgressContext.currentTab}
- Duración de la lección: ${courseContext.learningProgressContext.timeInCurrentLesson}`
    : ''
}
