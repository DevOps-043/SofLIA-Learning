import { DialogueRuntimeError } from '../dialogue-runtime.errors'

export function throwDialogueSessionInsertError(message?: string): never {
  if (message?.includes('limite de 3 intentos')) {
    throw new DialogueRuntimeError(
      'DIALOGUE_ATTEMPT_LIMIT_REACHED',
      409,
      'Se alcanzo el limite de 3 intentos para esta actividad',
    )
  }

  throw new DialogueRuntimeError(
    'DIALOGUE_PERSISTENCE_FAILED',
    500,
    'No fue posible iniciar la sesion de dialogo',
    { message },
  )
}
