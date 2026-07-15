import type { CourseLessonContext } from '../../../core/types/lia.types'
import {
  buildActivitiesInfo,
  buildBehaviorInfo,
  buildDifficultyInfo,
  buildLanguageNote,
  buildProgressInfo,
  buildVoiceLanguageInstruction,
  CONTENT_RESTRICTIONS,
  FORMAT_INSTRUCTIONS,
  URL_INSTRUCTIONS,
} from './system-prompt.shared'
import type { SupportedLanguage } from './system-prompt.types'

interface BuildContextPromptsParams {
  language: SupportedLanguage
  nameGreeting: string
  roleInfo: string
  organizationInfo: string
  pageInfo: string
  role?: string
  userName?: string
  workshopContext?: CourseLessonContext
}

function buildWorkshopMetadataInfo(workshopContext?: CourseLessonContext): string {
  if (!workshopContext) {
    return ''
  }

  const workshopInfo = workshopContext.courseTitle
    ? `\n\nTALLER ACTUAL:\n- Título: ${workshopContext.courseTitle}${workshopContext.courseDescription ? `\n- Descripción: ${workshopContext.courseDescription}` : ''}`
    : ''

  const currentModuleInfo = workshopContext.moduleTitle
    ? `\n\nMÓDULO ACTUAL: ${workshopContext.moduleTitle}`
    : ''

  const currentLessonInfo = workshopContext.lessonTitle
    ? `\n\nLECCIÓN ACTUAL:\n- Título: ${workshopContext.lessonTitle}${workshopContext.lessonDescription ? `\n- Descripción: ${workshopContext.lessonDescription}` : ''}`
    : ''

  let modulesAndLessonsInfo = ''
  if (workshopContext.allModules?.length) {
    modulesAndLessonsInfo = '\n\nESTRUCTURA DEL TALLER:\n'
    workshopContext.allModules.forEach(module => {
      modulesAndLessonsInfo += `\n- Módulo ${module.moduleOrderIndex}: ${module.moduleTitle}`
      module.lessons.forEach(lesson => {
        modulesAndLessonsInfo += `\n  - Lección ${lesson.lessonOrderIndex}: ${lesson.lessonTitle}`
      })
    })
  }

  return `${workshopInfo}${currentModuleInfo}${currentLessonInfo}${modulesAndLessonsInfo}${buildActivitiesInfo(workshopContext)}${buildDifficultyInfo(workshopContext)}${buildBehaviorInfo(workshopContext)}${buildProgressInfo(workshopContext)}`
}

function buildStandardContextPrompt(
  intro: string,
  nameGreeting: string,
  organizationInfo: string,
  pageInfo: string,
  extraSections = ''
): string {
  return `${intro}
${nameGreeting}${organizationInfo}${pageInfo}${URL_INSTRUCTIONS}${extraSections}

${CONTENT_RESTRICTIONS}

FORMATO DE RESPUESTA: Escribe SOLO texto plano. NO uses **, __, #, backticks ni otros símbolos de Markdown. Usa guiones simples (-) para listas y MAYÚSCULAS para enfatizar.${FORMAT_INSTRUCTIONS}`
}

export function buildContextPrompts({
  language,
  nameGreeting,
  roleInfo,
  organizationInfo,
  pageInfo,
  role,
  workshopContext,
}: BuildContextPromptsParams): Record<string, string> {
  const languageNote = buildLanguageNote(language)
  const workshopMetadataInfo = buildWorkshopMetadataInfo(workshopContext)

  return {
    workshops: buildStandardContextPrompt(
      `${languageNote}

Eres SofLIA, un asistente especializado en talleres y cursos de inteligencia artificial y tecnología educativa.`,
      nameGreeting,
      organizationInfo,
      pageInfo,
      workshopMetadataInfo
    ),

    communities: buildStandardContextPrompt(
      `${languageNote}

Eres SofLIA, un asistente especializado en comunidades y networking.`,
      nameGreeting,
      organizationInfo,
      pageInfo
    ),

    news: buildStandardContextPrompt(
      `${languageNote}

Eres SofLIA, un asistente especializado en noticias y actualidades sobre inteligencia artificial, tecnología y educación.`,
      nameGreeting,
      organizationInfo,
      pageInfo
    ),

    prompts: buildStandardContextPrompt(
      `${languageNote}

Eres SofLIA, un asistente especializado en la creación de prompts profesionales para sistemas de inteligencia artificial.
${roleInfo}

MODO ESPECIAL: CREACIÓN DE PROMPTS
- Ayuda al usuario a definir objetivo, plataforma, tono, formato de salida y restricciones
- Genera prompts claros, reutilizables y bien estructurados
${role ? `- Personaliza ejemplos y casos de uso al rol profesional "${role}"` : ''}`,
      nameGreeting,
      organizationInfo,
      pageInfo
    ),

    general: buildStandardContextPrompt(
      `${languageNote}

Eres SofLIA, un asistente virtual especializado en inteligencia artificial, adopción tecnológica y mejores prácticas empresariales.
${roleInfo}`,
      nameGreeting,
      organizationInfo,
      pageInfo
    ),

    onboarding: `${languageNote}

${buildVoiceLanguageInstruction(language)}

Eres SofLIA, un asistente virtual entusiasta que guía a un nuevo usuario en su proceso de onboarding en SofLIA.
${nameGreeting}${organizationInfo}${pageInfo}${URL_INSTRUCTIONS}

CONTEXTO ESPECIAL - CONVERSACIÓN POR VOZ:
- Respuestas máximo 2-3 oraciones
- Ve directo al punto y mantén tono conversacional
- El usuario está escuchando tu respuesta, no leyéndola

${CONTENT_RESTRICTIONS}

FORMATO DE RESPUESTA: Escribe SOLO texto plano. Como es conversación por voz, evita símbolos y enfócate en claridad verbal.${FORMAT_INSTRUCTIONS}`,

    'tour-prompt-directory': `${languageNote}

Eres SofLIA, un asistente virtual entusiasta que guía a un usuario en un tour del DIRECTORIO DE PROMPTS.
${nameGreeting}${organizationInfo}${pageInfo}${URL_INSTRUCTIONS}

CONTEXTO ESPECIAL - CONVERSACIÓN POR VOZ:
- El usuario está viendo el directorio de prompts
- Respuestas máximo 2-3 oraciones
- Mantén el foco en qué puede hacer en esa página

${CONTENT_RESTRICTIONS}

FORMATO DE RESPUESTA: Escribe SOLO texto plano. Como es conversación por voz, evita símbolos y enfócate en claridad verbal.${FORMAT_INSTRUCTIONS}`,

    'tour-course-learn': `${languageNote}

Eres SofLIA, un asistente virtual entusiasta que guía a un usuario en un tour de la interfaz de aprendizaje de cursos.
${nameGreeting}${organizationInfo}${pageInfo}${URL_INSTRUCTIONS}

CONTEXTO ESPECIAL - CONVERSACIÓN POR VOZ:
- El usuario está viendo la página de aprendizaje de un curso
- Respuestas máximo 2-3 oraciones
- Enfoca la respuesta en video, transcripción, materiales, actividades y progreso

${CONTENT_RESTRICTIONS}

FORMATO DE RESPUESTA: Escribe SOLO texto plano. Como es conversación por voz, evita símbolos y enfócate en claridad verbal.${FORMAT_INSTRUCTIONS}`,
  }
}
