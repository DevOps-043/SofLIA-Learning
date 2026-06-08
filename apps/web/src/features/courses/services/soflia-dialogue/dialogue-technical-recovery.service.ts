import { DialogueRuntimeError } from './dialogue-runtime.errors'

export function isRecoverableDialogueEvaluationError(
  error: unknown,
): error is DialogueRuntimeError {
  return (
    error instanceof DialogueRuntimeError &&
    error.code === 'DIALOGUE_EVALUATION_FAILED'
  )
}

export function buildDialogueEvaluationRecoveryMessage() {
  return [
    'Recibi tu respuesta. Para poder ayudarte a avanzar, necesito un poco mas de evidencia.',
    'Continua con una version breve que incluya tu decision, la razon principal y un ejemplo aplicado al caso.',
  ].join(' ')
}
