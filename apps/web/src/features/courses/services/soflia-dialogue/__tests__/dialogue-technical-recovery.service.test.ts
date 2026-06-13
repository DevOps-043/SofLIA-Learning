import { describe, expect, it } from 'vitest'

import type { DialogueActivityConfig } from '../../../types/dialogue-runtime'
import {
  buildDialogueEvaluationRecoveryMessage,
  buildDialogueTechnicalRecovery,
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
