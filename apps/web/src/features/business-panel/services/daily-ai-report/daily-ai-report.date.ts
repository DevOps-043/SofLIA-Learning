/**
 * Zona horaria con la que se decide a qué día natural pertenece un informe.
 *
 * La plataforma opera en México (ver `lib/holidays/countries/mx.ts`), así que un
 * informe pedido a las 22:00 hora local pertenece a ese día y no al siguiente,
 * que es lo que ocurriría usando UTC.
 */
export const DAILY_REPORT_TIMEZONE = 'America/Mexico_City'

/**
 * Día natural actual en la zona de la aplicación, en formato `YYYY-MM-DD`.
 *
 * Se usa `en-CA` porque su formato corto ya es ISO, lo que evita reordenar
 * partes a mano.
 */
export function currentDailyReportDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_REPORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
