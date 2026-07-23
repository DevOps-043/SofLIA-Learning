/**
 * Segmentos de transcripción de vídeo con marcas de tiempo.
 *
 * Permiten que SofLIA responda "¿en qué minuto se explica X?" citando el punto
 * exacto del vídeo. Antes esto era imposible: la transcripción se guardaba como
 * texto plano sin ninguna referencia temporal.
 *
 * Módulo puro (sin dependencias de servidor ni de red): lo usan tanto el
 * procesamiento del vídeo como la construcción del contexto del chat.
 */

/** Un tramo de vídeo transcrito. `start`/`end` van en SEGUNDOS. */
export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

/** Tope defensivo: una transcripción no debería producir más tramos que esto. */
const MAX_SEGMENTS = 2_000

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/**
 * Normaliza el valor crudo almacenado en `transcript_segments`.
 *
 * El contenido proviene de un modelo y de una columna JSONB sin esquema, así que
 * NUNCA se asume su forma: se descarta cualquier elemento mal formado en lugar de
 * dejar que un `start` inválido acabe mostrándose al usuario como un tiempo real.
 */
export function parseTranscriptSegments(rawValue: unknown): TranscriptSegment[] {
  if (!Array.isArray(rawValue)) return []

  const segments: TranscriptSegment[] = []

  for (const entry of rawValue.slice(0, MAX_SEGMENTS)) {
    if (typeof entry !== 'object' || entry === null) continue

    const candidate = entry as Record<string, unknown>
    const start = candidate.start
    const text = typeof candidate.text === 'string' ? candidate.text.trim() : ''

    if (!isFiniteNumber(start) || !text) continue

    // `end` es opcional en la práctica: si falta o es incoherente, se iguala al
    // inicio antes que descartar un tramo cuyo texto sí es válido.
    const end = isFiniteNumber(candidate.end) && candidate.end >= start ? candidate.end : start

    segments.push({ end, start, text })
  }

  return segments.sort((a, b) => a.start - b.start)
}

/** Formatea segundos como `mm:ss`, o `h:mm:ss` cuando el vídeo supera la hora. */
export function formatTimecode(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/**
 * Convierte los segmentos en texto con marcas de tiempo para el prompt.
 *
 * `maxChars` acota lo que se inyecta: el contexto puede incluir varias lecciones
 * y superar el límite del modelo haría fallar la petición entera (400), dejando
 * a SofLIA sin responder nada. Al truncar se avisa explícitamente para que el
 * modelo sepa que el material está incompleto y no afirme cobertura total.
 */
export function formatSegmentsForPrompt(
  segments: TranscriptSegment[],
  maxChars: number,
): string {
  if (segments.length === 0) return ''

  const lines: string[] = []
  let usedChars = 0

  for (const segment of segments) {
    const line = `[${formatTimecode(segment.start)}] ${segment.text}`
    if (usedChars + line.length > maxChars) {
      lines.push('[...] (transcripcion truncada por longitud)')
      break
    }

    lines.push(line)
    usedChars += line.length + 1
  }

  return lines.join('\n')
}

/**
 * Texto de transcripción plano a partir de los segmentos, para mantener
 * `transcript_content` coherente con los segmentos recién generados.
 */
export function buildPlainTranscript(segments: TranscriptSegment[]): string {
  return segments.map((segment) => segment.text).join('\n\n')
}
