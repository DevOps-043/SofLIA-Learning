import {
  buildStudyPlannerPromptTemplate,
  generateAvailabilityPrompt as buildAvailabilityPrompt,
} from './study-planner.prompt.template'

function buildGreeting(userName?: string): string {
  return userName
    ? `El usuario se llama ${userName}. Usa su nombre para personalizar la conversacion.`
    : ''
}

function buildContextBlock(studyPlannerContextString?: string): string {
  if (!studyPlannerContextString) {
    return 'No hay datos disponibles aun.'
  }

  return `${studyPlannerContextString}\n\nREGLA ABSOLUTA: Solo puedes usar datos de ARRIBA. Si no esta ahi, NO EXISTE.`
}

/**
 * Genera el prompt del planificador de estudios
 */
export function generateStudyPlannerPrompt(params: {
  userName?: string
  studyPlannerContextString?: string
  currentDate: string
}): string {
  const { userName, studyPlannerContextString, currentDate } = params

  return buildStudyPlannerPromptTemplate({
    greeting: buildGreeting(userName),
    currentDate,
    contextBlock: buildContextBlock(studyPlannerContextString),
  })
}

export function generateAvailabilityPrompt(): string {
  return buildAvailabilityPrompt()
}
