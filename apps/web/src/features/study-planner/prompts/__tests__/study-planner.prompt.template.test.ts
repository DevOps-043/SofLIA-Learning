import { describe, expect, it } from 'vitest'
import { buildStudyPlannerPromptTemplate } from '../study-planner.prompt.template'

describe('study-planner.prompt.template', () => {
  it('stitches intro, rules and format sections into the final prompt', () => {
    const prompt = buildStudyPlannerPromptTemplate({
      contextBlock: 'CURSO: IA aplicada',
      currentDate: '2026-04-01',
      greeting: 'El usuario se llama Ana.',
    })

    expect(prompt).toContain('CURSO: IA aplicada')
    expect(prompt).toContain('FECHA DE HOY: 2026-04-01')
    expect(prompt).toContain('REGLA #00: PROTOCOLO DE SEGURIDAD DE FECHAS')
    expect(prompt).toContain('FORMATO DEL PLAN')
  })
})
