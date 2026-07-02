import { describe, expect, it } from 'vitest'

import type { DialogueActivityConfig } from '../../../types/dialogue-runtime'
import type { DialogueTurnRow } from '../dialogue-tables'
import {
  buildDialogueEvaluationRecoveryMessage,
  buildDialogueTechnicalRecovery,
  countConsecutiveDialogueTechnicalRecoveries,
  isDialogueStuckOnTechnicalFailures,
  MAX_CONSECUTIVE_DIALOGUE_TECHNICAL_RECOVERIES,
} from '../dialogue-technical-recovery.service'

// Config mínimo: solo importan rescueContent y hintLadder para la escalada.
const config = {
  rescueContent: 'Una buena decision define a quien afecta, por que y un ejemplo concreto.',
  hintLadder: [
    { id: 'h2', level: 2, content: 'Pista nivel 2' },
    { id: 'h1', level: 1, content: 'Empieza nombrando una decision concreta y su consecuencia' },
  ],
} as unknown as DialogueActivityConfig

describe('buildDialogueTechnicalRecovery (escalada anti-ciclo)', () => {
  it('1er fallo: pide reenvío (mensaje base)', () => {
    const message = buildDialogueTechnicalRecovery({ config, attempt: 1 })
    expect(message).toBe(buildDialogueEvaluationRecoveryMessage())
  })

  it('2do fallo: da la PRIMERA pista del hintLadder + redirige al video', () => {
    const message = buildDialogueTechnicalRecovery({ config, attempt: 2 })
    expect(message).toContain('Empieza nombrando una decision concreta') // hint level 1
    expect(message.toLowerCase()).toContain('video de la leccion')
  })

  it('3er fallo: da el rescueContent + redirige al video', () => {
    const message = buildDialogueTechnicalRecovery({ config, attempt: 3 })
    expect(message).toContain('Modelo de referencia')
    expect(message).toContain('Una buena decision define')
    expect(message.toLowerCase()).toContain('video de la leccion')
  })

  it('los tres mensajes son DISTINTOS (no se repite verbatim)', () => {
    const m1 = buildDialogueTechnicalRecovery({ config, attempt: 1 })
    const m2 = buildDialogueTechnicalRecovery({ config, attempt: 2 })
    const m3 = buildDialogueTechnicalRecovery({ config, attempt: 3 })
    expect(new Set([m1, m2, m3]).size).toBe(3)
  })
})

// Turno mínimo: el contador solo mira role y metadata.technicalRecovery.
function buildTurn(
  role: DialogueTurnRow['role'],
  metadata: Record<string, unknown> | null = null,
): DialogueTurnRow {
  return { role, metadata } as unknown as DialogueTurnRow
}

const recoveryTurn = () => buildTurn('assistant', { technicalRecovery: { code: 'DIALOGUE_EVALUATION_FAILED' } })

describe('countConsecutiveDialogueTechnicalRecoveries', () => {
  it('devuelve 0 sin turnos o sin recuperaciones', () => {
    expect(countConsecutiveDialogueTechnicalRecoveries([])).toBe(0)
    expect(
      countConsecutiveDialogueTechnicalRecoveries([
        buildTurn('assistant'),
        buildTurn('user'),
      ]),
    ).toBe(0)
  })

  it('cuenta la racha final aunque haya turnos de usuario intercalados', () => {
    const turns = [
      buildTurn('assistant'), // apertura normal
      buildTurn('user'),
      recoveryTurn(),
      buildTurn('user'),
      recoveryTurn(),
    ]
    expect(countConsecutiveDialogueTechnicalRecoveries(turns)).toBe(2)
  })

  it('una respuesta normal del asistente corta la racha', () => {
    const turns = [
      recoveryTurn(),
      buildTurn('user'),
      buildTurn('assistant'), // evaluación exitosa: resetea
      buildTurn('user'),
      recoveryTurn(),
    ]
    expect(countConsecutiveDialogueTechnicalRecoveries(turns)).toBe(1)
  })
})

describe('isDialogueStuckOnTechnicalFailures', () => {
  it('marca la sesión como atascada al alcanzar el tope de recuperaciones', () => {
    const belowCap = Array.from(
      { length: MAX_CONSECUTIVE_DIALOGUE_TECHNICAL_RECOVERIES - 1 },
      recoveryTurn,
    )
    expect(isDialogueStuckOnTechnicalFailures(belowCap)).toBe(false)

    const atCap = Array.from(
      { length: MAX_CONSECUTIVE_DIALOGUE_TECHNICAL_RECOVERIES },
      recoveryTurn,
    )
    expect(isDialogueStuckOnTechnicalFailures(atCap)).toBe(true)
  })
})
