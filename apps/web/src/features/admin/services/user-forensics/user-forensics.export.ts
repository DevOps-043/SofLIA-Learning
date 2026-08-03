import type { UserForensicSummary } from './user-forensics.types'

/**
 * Construcción del CSV forense (puro, testeable). Se exporta la línea de tiempo con las
 * marcas de tiempo en ISO UTC (fuente de verdad, sin ambigüedad de zona). Se abre
 * directamente en Excel/Sheets. Se antepone el BOM para acentos correctos en Excel.
 */

const CSV_HEADERS = [
  'timestamp_utc',
  'tipo',
  'titulo',
  'curso',
  'modulo',
  'leccion',
  'actividad',
  'detalle',
  'score',
  'refs',
] as const

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function refsToString(refIds: Record<string, string | null | undefined> | undefined): string {
  if (!refIds) return ''
  return Object.entries(refIds)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
}

export function buildForensicTimelineCsv(summary: UserForensicSummary): string {
  const rows: string[] = []
  rows.push(CSV_HEADERS.join(','))

  for (const event of summary.timeline) {
    rows.push(
      [
        event.atUtc,
        event.type,
        escapeCsv(event.title),
        escapeCsv(event.context?.courseTitle ?? ''),
        escapeCsv(event.context?.moduleTitle ?? ''),
        escapeCsv(event.context?.lessonTitle ?? ''),
        escapeCsv(event.context?.activityTitle ?? ''),
        escapeCsv(event.detail ?? ''),
        event.score === null || event.score === undefined ? '' : String(event.score),
        escapeCsv(refsToString(event.refIds)),
      ].join(','),
    )
  }

  // BOM (U+FEFF) para que Excel interprete UTF-8 (acentos) correctamente.
  const bom = String.fromCharCode(0xfeff)
  return `${bom}${rows.join('\r\n')}`
}

export function buildForensicExportFilename(userId: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `forensic-${userId}-${stamp}.csv`
}
