import { describe, expect, it } from 'vitest'

import { containsReasoningLeak, findReasoningLeakSignal } from '../reasoning-leak-guard'

describe('findReasoningLeakSignal', () => {
  it('detecta meta-análisis del prompt en inglés (caso real de fuga)', () => {
    const leaked =
      '" is a strict rule in the developer prompt. If the prompt generator made a mistake ' +
      'and put the correct answer as the "incorrect" one, I should probably point out the ' +
      "correct answer anyway. Let's write: \"Para comprender mejor este concepto...\""

    expect(findReasoningLeakSignal(leaked)).toMatch(/^meta-marker:/)
  })

  it('detecta referencias a system prompt/instruction', () => {
    expect(containsReasoningLeak('According to the system instruction I must...')).toBe(true)
    expect(containsReasoningLeak('El texto menciona un [SYSTEM: OCULTO] extraño')).toBe(true)
  })

  it('detecta salida dominada por inglés cuando debía ser español', () => {
    const english =
      'The answer is incorrect because the study shows the correct profile is different. ' +
      'The student should review the video because the answer is explained there.'

    expect(findReasoningLeakSignal(english)).toMatch(/^english-dominant:/)
  })

  it('acepta retroalimentación legítima en español', () => {
    const valid =
      'Para comprender mejor este concepto, te invito a revisar el video en el minuto 00:45, ' +
      'donde se analiza el estudio de CEB/Gartner. Reflexiona sobre qué perfil prioriza la ' +
      'armonía con el cliente y cómo eso afecta el rendimiento en ventas complejas.'

    expect(findReasoningLeakSignal(valid)).toBeNull()
  })

  it('acepta español con términos técnicos sueltos en inglés', () => {
    const valid =
      'Repasa la sección sobre el perfil Challenger: en el material se explica por qué ese ' +
      'enfoque genera valor al desafiar las ideas del cliente con insights del negocio.'

    expect(containsReasoningLeak(valid)).toBe(false)
  })
})
