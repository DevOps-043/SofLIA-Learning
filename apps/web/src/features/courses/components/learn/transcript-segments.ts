export interface TranscriptSegment {
  /** Marca de tiempo formateada (mm:ss o h:mm:ss); `null` para texto sin marca. */
  time: string | null;
  content: string;
}

// Detecta marcas tipo [00:00], (1:23:45) al inicio de linea.
const TIMESTAMP_SPLIT_REGEX = /(?:^|\n)\s*[[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]\s*/;

/**
 * Parte una transcripcion en segmentos {time, content} a partir de las marcas de
 * tiempo embebidas en el texto. No altera las marcas: solo las extrae.
 */
export function parseTranscriptSegments(text: string): TranscriptSegment[] {
  if (!text) return [];

  const parts = text.split(TIMESTAMP_SPLIT_REGEX);
  const segments: TranscriptSegment[] = [];

  if (parts[0] && parts[0].trim()) {
    segments.push({ time: null, content: parts[0].trim() });
  }

  for (let i = 1; i < parts.length; i += 2) {
    const time = parts[i] ?? null;
    const content = parts[i + 1]?.trim() || '';
    if (time || content) {
      segments.push({ time, content });
    }
  }

  return segments;
}

/** Convierte "mm:ss" o "h:mm:ss" a segundos. Devuelve 0 si no es valido. */
export function parseTimestampToSeconds(time: string): number {
  const parts = time.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Formatea segundos a "m:ss" (o "h:mm:ss" si supera la hora). */
export function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

/**
 * Realinea las marcas de tiempo de los segmentos contra la duracion REAL del video.
 *
 * Motivo: muchas transcripciones se generan automaticamente con marcas inventadas
 * que no corresponden al video (p. ej. marcas hasta 05:30 en un video de 1:05).
 *
 * Estrategia conservadora: solo se recalcula cuando las marcas son INCONSISTENTES
 * (la mayor excede la duracion real). En ese caso se redistribuyen por la posicion
 * relativa del texto (un segmento con mas contenido ocupa mas tiempo), garantizando
 * marcas dentro de [0, duracion]. Si las marcas ya caben en el video, se respetan;
 * si no hay duracion fiable, no se toca nada.
 */
export function alignTranscriptSegmentTimes(
  segments: TranscriptSegment[],
  videoDurationSeconds: number | null | undefined,
): TranscriptSegment[] {
  if (!videoDurationSeconds || videoDurationSeconds <= 0) return segments;

  const timedSegments = segments.filter((segment) => segment.time != null);
  if (timedSegments.length === 0) return segments;

  const maxOriginalSeconds = Math.max(
    ...timedSegments.map((segment) => parseTimestampToSeconds(segment.time as string)),
  );

  // Las marcas ya son coherentes con la duracion del video -> no las tocamos.
  if (maxOriginalSeconds <= videoDurationSeconds) return segments;

  const totalChars = segments.reduce((sum, segment) => sum + segment.content.length, 0);
  if (totalChars === 0) return segments;

  let charOffset = 0;
  return segments.map((segment) => {
    const aligned: TranscriptSegment =
      segment.time != null
        ? { ...segment, time: formatTimestamp((charOffset / totalChars) * videoDurationSeconds) }
        : segment;
    charOffset += segment.content.length;
    return aligned;
  });
}
