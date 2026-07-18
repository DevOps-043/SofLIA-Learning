/**
 * Guardrail para salidas de IA orientadas al usuario final.
 *
 * Detecta señales de que el texto generado contiene razonamiento interno
 * (chain-of-thought) o meta-análisis de instrucciones en lugar de la respuesta
 * final. Complementa al filtrado de partes `thought` en `lib/gemini/client.ts`:
 * ese filtrado elimina el razonamiento estructurado del proveedor, y este guard
 * captura el caso en que el modelo "piensa en voz alta" dentro de la propia
 * respuesta (típicamente en inglés y citando sus reglas o el prompt).
 *
 * Es determinista y sin dependencias para poder testearlo unitariamente y
 * usarlo en cualquier endpoint que devuelva texto de IA al usuario.
 */

const META_REASONING_MARKERS: ReadonlyArray<RegExp> = [
  /developer prompt/i,
  /system (?:prompt|instruction)/i,
  /prompt generator/i,
  /\bmy instructions\b/i,
  /strict rule in the/i,
  /let'?s write\b/i,
  /\bi should (?:probably\s+)?(?:point|say|write|mention|answer)\b/i,
  /the (?:student|user) answered\b/i,
  /\[SYSTEM[:\]]/i,
]

// Palabras funcionales frecuentes por idioma para estimar dominancia de inglés
// en una salida que debe ser exclusivamente en español o portugués.
const ENGLISH_FUNCTION_WORDS =
  /\b(?:the|is|are|should|would|because|answer|correct|incorrect|probably|actually|anyway|wrote|write)\b/gi
const SPANISH_PORTUGUESE_FUNCTION_WORDS =
  /\b(?:el|la|los|las|es|son|porque|respuesta|correcta|incorrecta|para|que|con|una?|do|da|uma?|é|resposta)\b/gi

const MIN_ENGLISH_MATCHES_FOR_DOMINANCE = 8

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

/**
 * Devuelve la señal de fuga detectada (para logging/observabilidad) o `null`
 * si el texto parece una respuesta final legítima.
 */
export function findReasoningLeakSignal(text: string): string | null {
  const marker = META_REASONING_MARKERS.find((pattern) => pattern.test(text))
  if (marker) {
    return `meta-marker:${marker.source}`
  }

  const englishCount = countMatches(text, ENGLISH_FUNCTION_WORDS)
  const localCount = countMatches(text, SPANISH_PORTUGUESE_FUNCTION_WORDS)

  if (englishCount >= MIN_ENGLISH_MATCHES_FOR_DOMINANCE && englishCount > localCount) {
    return `english-dominant:${englishCount}en/${localCount}es`
  }

  return null
}

export function containsReasoningLeak(text: string): boolean {
  return findReasoningLeakSignal(text) !== null
}
