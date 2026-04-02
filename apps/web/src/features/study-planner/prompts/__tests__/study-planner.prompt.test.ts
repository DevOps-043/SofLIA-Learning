import { describe, expect, it } from 'vitest'
import { generateAvailabilityPrompt, generateStudyPlannerPrompt } from '../study-planner.prompt'

describe('study-planner.prompt', () => {
  it('injects greeting, date and validated context into the planner prompt', () => {
    const prompt = generateStudyPlannerPrompt({
      userName: 'Ana',
      studyPlannerContextString: 'CURSO: IA Aplicada',
      currentDate: '2026-04-01',
    })

    expect(prompt).toContain('El usuario se llama Ana.')
    expect(prompt).toContain('FECHA DE HOY: 2026-04-01')
    expect(prompt).toContain('CURSO: IA Aplicada')
    expect(prompt).toContain('REGLA ABSOLUTA: Solo puedes usar datos de ARRIBA.')
  })

  it('falls back cleanly when there is no planner context', () => {
    const prompt = generateStudyPlannerPrompt({
      currentDate: '2026-04-01',
    })

    expect(prompt).toContain('No hay datos disponibles aun.')
  })

  it('returns the availability prompt template', () => {
    expect(generateAvailabilityPrompt().length).toBeGreaterThan(50)
  })
})
