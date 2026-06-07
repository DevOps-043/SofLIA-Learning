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
    'Recibi tu respuesta, pero la evaluacion automatica no pudo completarse en este momento.',
    'Para no cerrar la actividad por un fallo tecnico, continua con una version breve que incluya tu decision, la razon principal y un ejemplo aplicado al caso.',
  ].join(' ')
}
