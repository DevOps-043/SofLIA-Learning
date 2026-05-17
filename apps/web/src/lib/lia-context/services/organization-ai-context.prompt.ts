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
