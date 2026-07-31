import { describe, expect, it } from 'vitest'

import { currentDailyReportDate } from '../daily-ai-report.date'

describe('currentDailyReportDate', () => {
  it('usa el día de la zona de la aplicación, no el de UTC', () => {
    // 2026-08-01T02:30Z son las 20:30 del 31 de julio en Ciudad de México: el
    // informe pertenece al 31, que es el día que vive el usuario.
    expect(currentDailyReportDate(new Date('2026-08-01T02:30:00Z'))).toBe('2026-07-31')
  })

  it('cambia de día a la medianoche local', () => {
    // 05:59Z = 23:59 del 31 (CDT, UTC-6); 06:00Z = 00:00 del 1 de agosto.
    expect(currentDailyReportDate(new Date('2026-08-01T05:59:00Z'))).toBe('2026-07-31')
    expect(currentDailyReportDate(new Date('2026-08-01T06:00:00Z'))).toBe('2026-08-01')
  })

  it('devuelve el mismo día para dos momentos de la misma jornada', () => {
    const morning = currentDailyReportDate(new Date('2026-07-31T14:00:00Z'))
    const evening = currentDailyReportDate(new Date('2026-08-01T03:00:00Z'))

    expect(morning).toBe(evening)
  })

  it('formatea siempre como YYYY-MM-DD', () => {
    expect(currentDailyReportDate(new Date('2026-01-05T18:00:00Z'))).toBe('2026-01-05')
  })
})
