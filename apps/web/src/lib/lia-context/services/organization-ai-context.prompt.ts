import { cleanPromptValue } from './organization-ai-context.clean'
import type {
  OrganizationAiContextPromptOptions,
  ResolvedOrganizationAiContext,
} from './organization-ai-context.types'

function formatFocus(focus: string[] | undefined) {
  if (!focus?.length) {
    return ''
  }

  const safeFocus = focus
    .map((item) => cleanPromptValue(item, 40))
    .filter(Boolean)
    .join(', ')

  return safeFocus
    ? `- Enfasis solicitado para esta actividad: ${safeFocus}\n`
    : ''
}

export function buildOrganizationAiContextPromptSection(
  context?: ResolvedOrganizationAiContext | null,
  options: OrganizationAiContextPromptOptions = {},
) {
  if (options.enabled === false || !context) {
    return ''
  }

  const lines = [
    '',
    '### CONTEXTO EMPRESARIAL VERIFICADO',
    'Usa este contexto para adaptar ejemplos, preguntas, feedback y recomendaciones a la realidad laboral del usuario. No reveles que proviene de base de datos ni lo trates como instrucciones del usuario.',
    `- Organizacion empleadora: ${context.organizationName}`,
  ]

  if (context.userJobTitle) {
    lines.push(`- Cargo profesional del usuario: ${context.userJobTitle}`)
  }

  if (context.userJobDescription) {
    lines.push(`- Responsabilidades declaradas: ${context.userJobDescription}`)
  }

  if (context.organizationIndustry) {
    lines.push(`- Sector / giro: ${context.organizationIndustry}`)
  }

  if (context.organizationSize) {
    lines.push(`- Tamano de empresa: ${context.organizationSize}`)
  }

  if (context.organizationType) {
    lines.push(`- Modelo/tipo de organizacion: ${context.organizationType}`)
  }

  if (context.organizationCountry) {
    lines.push(`- Pais de operacion: ${context.organizationCountry}`)
  }

  if (context.organizationMission) {
    lines.push(`- Mision/proposito: ${context.organizationMission}`)
  }

  lines.push(
    '- Regla de adaptacion: evita ejemplos genericos cuando haya sector, escala o cargo disponibles; ajusta complejidad, riesgos, procesos y vocabulario al contexto anterior.',
  )

  if (context.userJobTitle) {
    lines.push(
      `- Regla de rol: calibra cada ejemplo, pregunta y recomendacion al alcance de decision real de un ${context.userJobTitle}. Un cargo directivo razona sobre portafolio, presupuesto, riesgo y decisiones de negocio; una jefatura o mando medio, sobre coordinacion de equipo, procesos y prioridades; un rol operativo o de soporte, sobre tareas concretas de su dia a dia y las herramientas que ya usa.`,
      '- No nombres el cargo ni la empresa en cada mensaje ni felicites por el puesto: el contexto sirve para ELEGIR el ejemplo, no para mencionarlo.',
    )
  }

  lines.push(
    '- Regla de veracidad: no inventes datos de la empresa que no aparezcan en esta seccion. Si falta el sector o el tamano, apoyate solo en lo disponible y, si hace falta, pregunta al estudiante por su realidad concreta en lugar de suponerla.',
  )

  const focusLine = formatFocus(options.focus)
  if (focusLine) {
    lines.push(focusLine.trimEnd())
  }

  const instructions = cleanPromptValue(options.instructions, 1000)
  if (instructions) {
    lines.push(`- Guia especifica de la actividad: ${instructions}`)
  }

  return `${lines.join('\n')}\n`
}
