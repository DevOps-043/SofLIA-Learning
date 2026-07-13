/**
 * Coincidencia de nombres insensible a acentos, mayúsculas y orden de palabras.
 *
 * Problema: el admin escribe "Maria Domenzain" y en la base de datos el nombre
 * es "María Domenzain". Un `ilike '%Maria Domenzain%'` NO coincide, porque en
 * Postgres 'i' ≠ 'í' (`ilike` ignora mayúsculas, no diacríticos). Eso hacía que
 * SofLIA no encontrara al usuario y acabara pidiendo el correo.
 *
 * Estrategia en dos pasos, sin depender de la extensión `unaccent` (que exigiría
 * una migración y no está garantizada en todos los entornos):
 *
 *  1. SQL — patrón TOLERANTE: se sustituye cada letra susceptible de llevar
 *     tilde/diéresis (vocales y la "n" de "ñ") por el comodín `_` de LIKE, que
 *     casa con exactamente un carácter. Así "Maria" busca "M_r__" y trae tanto
 *     "Maria" como "María". Es un filtro amplio: su único objetivo es traer
 *     CANDIDATOS del servidor sin cargar la tabla entera.
 *  2. JS — comparación EXACTA: los candidatos se filtran comparando las formas
 *     normalizadas (sin diacríticos, en minúsculas), de modo que los falsos
 *     positivos del patrón amplio se descartan aquí.
 *
 * Todas las funciones son puras y están cubiertas por tests.
 */

/**
 * Letras que pueden aparecer acentuadas y que el patrón SQL debe tolerar.
 * Incluye la "c" por la cedilla portuguesa ("França"), idioma soportado.
 */
const ACCENT_PRONE_LETTERS = /[aeiouncáéíóúüàèìòùâêîôûãõçñ]/gi

/** Marcas diacríticas combinantes (resultado de normalizar a NFD). */
const COMBINING_DIACRITICS = /[̀-ͯ]/g

/**
 * Normaliza un nombre para comparar: sin diacríticos, en minúsculas y sin
 * espacios redundantes. "María  Domenzáin" → "maria domenzain".
 */
export function normalizeNameForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Construye el patrón LIKE tolerante a acentos para la consulta SQL.
 * Devuelve `null` si el término no deja nada buscable.
 */
export function buildAccentTolerantPattern(value: string): string | null {
  const normalized = normalizeNameForMatch(value)
  if (!normalized) return null

  // Los comodines de LIKE que traiga el término se neutralizan antes (el
  // llamador usa `stripLikeWildcards`), así que aquí solo introducimos los
  // nuestros: `_` por cada letra acentuable.
  return `%${normalized.replace(ACCENT_PRONE_LETTERS, '_')}%`
}

/**
 * ¿El nombre buscado coincide con el candidato?
 *
 * Coincide si TODAS las palabras del término aparecen en el nombre del
 * candidato (comparando en forma normalizada). Esto acepta "Maria Domenzain"
 * contra "María Domenzain", "domenzain maria" contra "María Domenzain" y
 * "Maria" contra "María Domenzain", pero rechaza los falsos positivos que el
 * patrón amplio de SQL pueda arrastrar.
 */
export function matchesSearchedName(
  searchedName: string,
  candidateName: string | null | undefined,
): boolean {
  if (!candidateName) return false

  const normalizedCandidate = normalizeNameForMatch(candidateName)
  if (!normalizedCandidate) return false

  const searchedWords = normalizeNameForMatch(searchedName)
    .split(' ')
    .filter(Boolean)
  if (searchedWords.length === 0) return false

  return searchedWords.every((word) => normalizedCandidate.includes(word))
}
