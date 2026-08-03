import type { DialogueActivityConfig } from '../../types/dialogue-runtime'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import type { DialogueTurnRow } from './dialogue-tables'

export function isRecoverableDialogueEvaluationError(
  error: unknown,
): error is DialogueRuntimeError {
  return (
    error instanceof DialogueRuntimeError &&
    error.code === 'DIALOGUE_EVALUATION_FAILED'
  )
}

/**
 * Tope de mensajes de recuperación técnica consecutivos. La escalada tiene 3 niveles
 * (reenvío → pista → rescate); a partir de ahí repetir el mismo rescate no aporta nada:
 * el fallo es del servicio de evaluación, no del estudiante, y hay que reportarlo como
 * indisponibilidad (503) y permitir reiniciar la actividad sin consumir intentos.
 */
export const MAX_CONSECUTIVE_DIALOGUE_TECHNICAL_RECOVERIES = 3

/**
 * Cuenta cuántos mensajes de recuperación técnica consecutivos lleva SofLIA (mirando
 * los turnos de asistente más recientes hacia atrás; los turnos del usuario no cortan
 * la racha). Sirve para escalar la guía y para detectar una sesión atascada por fallos
 * técnicos persistentes.
 */
export function countConsecutiveDialogueTechnicalRecoveries(
  turns: DialogueTurnRow[],
): number {
  let count = 0
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index]
    if (turn.role !== 'assistant') continue
    const metadata = turn.metadata as { technicalRecovery?: unknown } | null | undefined
    if (metadata?.technicalRecovery) {
      count += 1
    } else {
      break
    }
  }
  return count
}

export function isDialogueStuckOnTechnicalFailures(turns: DialogueTurnRow[]): boolean {
  return (
    countConsecutiveDialogueTechnicalRecoveries(turns) >=
    MAX_CONSECUTIVE_DIALOGUE_TECHNICAL_RECOVERIES
  )
}

/**
 * Mensaje base del primer fallo técnico (reintento de envío).
 *
 * REGLA: nunca atribuir al estudiante un fallo del sistema.
 *
 * Antes este mensaje decía "necesito un poco mas de evidencia", que es el texto
 * de una respuesta floja. Se eligió a propósito para que sonara pedagógico, pero
 * al leerse tras una respuesta CORRECTA convertía una avería en una acusación:
 * el alumno reescribía una y otra vez una respuesta que ya valía, y el docente
 * concluía que SofLIA calificaba mal. La calificación nunca llegó a ocurrir.
 *
 * El mensaje ahora dice la verdad —no pude procesar la respuesta— sin alarmar y
 * sin desperdiciar el turno: se sigue ofreciendo trabajo útil.
 */
export function buildDialogueEvaluationRecoveryMessage() {
  return [
    'No pude terminar de procesar tu respuesta por un problema tecnico de mi lado, no por lo que escribiste.',
    'Vuelve a enviarla y seguimos: si quieres, aprovecha para añadir el ejemplo concreto con el que la aplicarias.',
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
    const intro =
      'Sigo sin poder registrar tu respuesta por el fallo tecnico, asi que no te dejo esperando: aqui tienes la referencia de la actividad.'
    const model = rescue ? ` Modelo de referencia: ${ensureSentence(rescue)}` : ''
    return `${intro}${model} ${RETURN_TO_VIDEO_CTA}`.trim()
  }

  if (attempt === 2) {
    const firstHint = [...config.hintLadder]
      .sort((a, b) => a.level - b.level)
      .map((hint) => hint.content?.trim())
      .find(Boolean)

    if (firstHint) {
      return `El fallo tecnico persiste y todavia no puedo calificar tu respuesta. Mientras lo resuelvo, avanza con esta pista: ${ensureSentence(firstHint)} ${RETURN_TO_VIDEO_CTA}`
    }

    return `El fallo tecnico persiste y todavia no puedo calificar tu respuesta. Mientras tanto, tenla lista con tu decision, su razon principal y un ejemplo concreto del escenario. ${RETURN_TO_VIDEO_CTA}`
  }

  return buildDialogueEvaluationRecoveryMessage()
}
