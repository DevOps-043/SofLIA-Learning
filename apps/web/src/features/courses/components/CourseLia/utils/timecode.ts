/**
 * Convierte una marca de tiempo `mm:ss` o `h:mm:ss` en segundos.
 *
 * Se usa para hacer clicables los timestamps que SofLIA cita en el chat y llevar
 * el reproductor a ese punto del vídeo. Devuelve `null` si el formato no es
 * válido, para no saltar a una posición inventada.
 */
export function parseTimecodeToSeconds(timecode: string): number | null {
  const parts = timecode.split(':')
  if (parts.length < 2 || parts.length > 3) return null

  const numbers = parts.map((part) => Number(part))
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) return null

  const [first, second, third] = numbers
  const seconds =
    parts.length === 3
      ? first * 3600 + second * 60 + third
      : first * 60 + second

  return Number.isFinite(seconds) ? seconds : null
}
