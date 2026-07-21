/**
 * Formateo de marcas de tiempo para auditoría/forense.
 *
 * PROBLEMA que resuelve: los paneles formateaban con `new Date(v).toLocaleString()`
 * SIN zona horaria explícita, así que renderizaban en la hora local del navegador sin
 * etiquetarla, mientras la BD (`timestamptz`) guarda UTC. Al cruzar "10:48" (local, sin
 * etiqueta) contra "14:38" (UTC en Supabase) parecía que la actividad ocurrió después de
 * la última conexión. Aquí SIEMPRE se formatea con una zona explícita y se muestra la
 * etiqueta de zona, de modo que el auditor pueda cruzar 1:1 con la base de datos.
 *
 * El dato SIEMPRE viaja como ISO UTC; la zona es solo presentación.
 */

export type ForensicTimeZone = 'utc' | 'local'

/** Zona IANA local del entorno (navegador o servidor). */
export function resolveLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function toIanaZone(zone: ForensicTimeZone): string {
  return zone === 'utc' ? 'UTC' : resolveLocalTimeZone()
}

/**
 * Formatea una marca ISO (UTC) en la zona pedida, con etiqueta de zona visible.
 * Ej: "2026-07-18 14:38:03 UTC" o "18 jul 2026, 08:38 GMT-6".
 */
export function formatForensicTimestamp(
  isoUtc: string | null | undefined,
  zone: ForensicTimeZone = 'utc',
  locale?: string,
): string {
  if (!isoUtc) return '—'
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return '—'

  const timeZone = toIanaZone(zone)
  // Para UTC usamos un formato ISO-like sin ambigüedad; para local, uno legible.
  const formatted = new Intl.DateTimeFormat(locale ?? (zone === 'utc' ? 'en-CA' : undefined), {
    year: 'numeric',
    month: zone === 'utc' ? '2-digit' : 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
    timeZoneName: 'short',
  }).format(date)

  return formatted
}

/** Etiqueta corta de la zona activa, para encabezados/toggles. */
export function forensicTimeZoneLabel(zone: ForensicTimeZone): string {
  return zone === 'utc' ? 'UTC' : resolveLocalTimeZone()
}
