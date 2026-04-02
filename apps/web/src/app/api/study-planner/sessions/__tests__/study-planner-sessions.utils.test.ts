import { describe, expect, it } from 'vitest'
import {
  parseStudyPlannerSessionsDateRange,
} from '../study-planner-sessions.utils'

describe('parseStudyPlannerSessionsDateRange', () => {
  it('parses valid start and end dates', () => {
    const result = parseStudyPlannerSessionsDateRange(
      'https://example.com/api/study-planner/sessions?startDate=2026-04-01T00:00:00.000Z&endDate=2026-04-30T00:00:00.000Z',
    )

    expect(result.startDate.toISOString()).toBe('2026-04-01T00:00:00.000Z')
    expect(result.endDate.toISOString()).toBe('2026-04-30T00:00:00.000Z')
  })

  it('throws when required params are missing', () => {
    expect(() =>
      parseStudyPlannerSessionsDateRange(
        'https://example.com/api/study-planner/sessions',
      ),
    ).toThrow('Faltan parametros startDate y endDate')
  })

  it('throws when date params are invalid', () => {
    expect(() =>
      parseStudyPlannerSessionsDateRange(
        'https://example.com/api/study-planner/sessions?startDate=invalid&endDate=2026-04-30T00:00:00.000Z',
      ),
    ).toThrow('startDate y endDate deben ser fechas validas')
  })

  it('throws when endDate is before startDate', () => {
    expect(() =>
      parseStudyPlannerSessionsDateRange(
        'https://example.com/api/study-planner/sessions?startDate=2026-04-30T00:00:00.000Z&endDate=2026-04-01T00:00:00.000Z',
      ),
    ).toThrow('endDate debe ser posterior o igual a startDate')
  })
})
