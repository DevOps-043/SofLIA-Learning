import { describe, expect, it } from 'vitest'

import { dialogueEvaluationResultSchema, type DialogueActivityConfig } from '../../../types/dialogue-runtime'
import { normalizeDialogueEvaluationPayload } from '../dialogue-evaluation.normalizer'

/**
 * El esquema es `.strict()` y antes se aplicaba con `.parse()` directo sobre la
 * salida del modelo: cualquier desviación cosmética destruía la evaluación
 * completa y el estudiante recibía un mensaje de avería en lugar de su nota.
 *
 * Cada caso de aquí es una forma en que un modelo real rompe el contrato sin
 * equivocarse en el fondo. La comprobación siempre es la misma: que sobreviva
 * a `dialogueEvaluationResultSchema.parse()`.
 */
const config = {
  successCriteria: [
    { id: 'c1', label: 'Define el objetivo del mensaje', required: true },
    { id: 'c2', label: 'Especifica la audiencia', required: true },
    { id: 'c3', label: 'Elige el canal', required: false },
  ],
  rubric: [{ id: 'd1', label: 'Aplicacion' }],
} as unknown as DialogueActivityConfig

function parse(raw: unknown) {
  return dialogueEvaluationResultSchema.parse(normalizeDialogueEvaluationPayload(raw, config))
}

describe('normalizeDialogueEvaluationPayload', () => {
  it('descarta claves extra en lugar de tirar la evaluacion entera', () => {
    const result = parse({
      confidence: 0.9,
      criteriaMet: ['c1'],
      decision: 'partial_continue',
      internalNotes: 'algo que el modelo añadio por su cuenta',
      overallScore: 70,
      recommendedNextState: 'CHALLENGE_OR_PROBE',
    })

    expect(result.criteriaMet).toEqual(['c1'])
    expect(result.overallScore).toBe(70)
  })

  it('recorta las citas de evidencia largas en vez de rechazarlas', () => {
    // La respuesta del alumno del incidente real superaba los 400 caracteres:
    // citarla entera invalidaba el esquema y anulaba la evaluación.
    const result = parse({
      criteriaMet: ['c1'],
      decision: 'complete',
      evidenceQuotes: ['a'.repeat(900)],
      overallScore: 80,
      recommendedNextState: 'COMPLETE',
    })

    expect(result.evidenceQuotes[0]).toHaveLength(400)
  })

  it('traduce etiquetas legibles al ID real del criterio', () => {
    // Sin esto la política no reconoce ningún criterio obligatorio cumplido y el
    // estudiante no aprueba jamás, por correcta que sea su respuesta.
    const result = parse({
      criteriaMet: ['Define el objetivo del mensaje', 'ESPECIFICA LA AUDIENCIA'],
      decision: 'complete',
      overallScore: 85,
      recommendedNextState: 'COMPLETE',
    })

    expect(result.criteriaMet).toEqual(['c1', 'c2'])
  })

  it('descarta criterios que no existen en la actividad', () => {
    const result = parse({
      criteriaMet: ['c1', 'criterio-inventado'],
      decision: 'partial_continue',
      overallScore: 50,
      recommendedNextState: 'HINT',
    })

    expect(result.criteriaMet).toEqual(['c1'])
  })

  it('un criterio no puede estar cumplido y faltando a la vez', () => {
    const result = parse({
      criteriaMet: ['c1'],
      criteriaMissing: ['c1', 'c2'],
      decision: 'partial_continue',
      overallScore: 50,
      recommendedNextState: 'CHALLENGE_OR_PROBE',
    })

    expect(result.criteriaMet).toEqual(['c1'])
    expect(result.criteriaMissing).toEqual(['c2'])
  })

  it('acepta la nota como cadena y la acota al rango valido', () => {
    expect(parse({ decision: 'complete', overallScore: '85', recommendedNextState: 'COMPLETE' }).overallScore).toBe(85)
    expect(parse({ decision: 'complete', overallScore: 140, recommendedNextState: 'COMPLETE' }).overallScore).toBe(100)
    expect(parse({ decision: 'complete', overallScore: -5, recommendedNextState: 'COMPLETE' }).overallScore).toBe(0)
  })

  it('NO reescala la nota: un 1 sigue siendo un 1', () => {
    // Reescalar 0-1 a 0-100 aprobaría a quien no debía aprobar. Se repara la
    // forma, nunca el fondo.
    expect(parse({ decision: 'fail_or_retry', overallScore: 1, recommendedNextState: 'HINT' }).overallScore).toBe(1)
  })

  it('desenvuelve el objeto cuando el modelo lo anida', () => {
    const result = parse({
      evaluation: {
        criteriaMet: ['c1'],
        decision: 'partial_continue',
        overallScore: 60,
        recommendedNextState: 'CHALLENGE_OR_PROBE',
      },
    })

    expect(result.overallScore).toBe(60)
    expect(result.criteriaMet).toEqual(['c1'])
  })

  it('normaliza banderas ausentes o desconocidas sin inventar riesgo', () => {
    const result = parse({
      decision: 'partial_continue',
      flags: { inventada: true, promptInjection: true },
      overallScore: 40,
      recommendedNextState: 'HINT',
    })

    expect(result.flags.promptInjection).toBe(true)
    expect(result.flags.keywordStuffing).toBe(false)
    expect(result.flags).not.toHaveProperty('inventada')
  })

  it('sustituye enums invalidos por valores seguros que no cierran la sesion', () => {
    const result = parse({
      decision: 'necesita_mas_trabajo',
      overallScore: 55,
      recommendedNextState: 'SEGUIR_PREGUNTANDO',
    })

    expect(result.decision).toBe('partial_continue')
    expect(result.recommendedNextState).toBe('CHALLENGE_OR_PROBE')
  })

  it('sobrevive a una respuesta vacia o de forma inesperada', () => {
    expect(() => parse({})).not.toThrow()
    expect(() => parse(null)).not.toThrow()
    expect(() => parse([1, 2, 3])).not.toThrow()
  })
})
