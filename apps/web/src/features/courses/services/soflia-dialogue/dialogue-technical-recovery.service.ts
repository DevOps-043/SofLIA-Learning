import type { DialogueActivityConfig } from '../../types/dialogue-runtime'
import { DialogueRuntimeError } from './dialogue-runtime.errors'

export function isRecoverableDialogueEvaluationError(
  error: unknown,
): error is DialogueRuntimeError {
  return (
    error instanceof DialogueRuntimeError &&
    error.code === 'DIALOGUE_EVALUATION_FAILED'
  )
}

/** Mensaje base del primer fallo técnico (reintento de envío). */
export function buildDialogueEvaluationRecoveryMessage() {
  return [
    'Recibi tu respuesta. Para poder ayudarte a avanzar, necesito un poco mas de evidencia.',
    'Continua con una version breve que incluya tu decision, la razon principal y un ejemplo aplicado al caso.',
  ].join(' ')
}

function ensureSentence(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return ''
  return /[.!?)]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

const RETURN_TO_VIDEO_CTA =
  'Si quieres reforzar la idea, vuelve al video de la leccion y retomalo desde ahi antes de continuar.'

/**
 * Construye una recuperación ESCALADA cuando la evaluación con SofLIA falla por un
 * problema técnico (p. ej. la IA no respondió). En vez de repetir SIEMPRE el mismo
 * texto, escala según cuántos fallos técnicos consecutivos van:
 *
 *  1er fallo  -> pedir reenvío (mensaje base).
 *  2do fallo  -> dar una PISTA concreta del `hintLadder` + sugerir volver al video.
 *  3er+ fallo -> dar el `rescueContent` (modelo de referencia) + redirigir al video.
 *
 * Reutiliza los datos que el config ya tiene (hintLadder / rescueContent) y nunca
 * penaliza el puntaje del estudiante (no crea una evaluación con score 0): solo guía.
 */
export function buildDialogueTechnicalRecovery(input: {
  config: DialogueActivityConfig
  attempt: number
}): string {
  const { config, attempt } = input

  if (attempt >= 3) {
    const rescue = config.rescueContent?.trim()
    const intro = 'Veo que nos estamos trabando, asi que te dejo una guia para destrabarte.'
    const model = rescue ? ` Modelo de referencia: ${ensureSentence(rescue)}` : ''
    return `${intro}${model} ${RETURN_TO_VIDEO_CTA}`.trim()
  }

  if (attempt === 2) {
    const firstHint = [...config.hintLadder]
      .sort((a, b) => a.level - b.level)
      .map((hint) => hint.content?.trim())
      .find(Boolean)

    if (firstHint) {
      return `Te doy una pista para avanzar: ${ensureSentence(firstHint)} ${RETURN_TO_VIDEO_CTA}`
    }

    return `Aun necesito un poco mas de evidencia. Responde breve con tu decision, su razon principal y un ejemplo concreto del escenario. ${RETURN_TO_VIDEO_CTA}`
  }

  return buildDialogueEvaluationRecoveryMessage()
}
