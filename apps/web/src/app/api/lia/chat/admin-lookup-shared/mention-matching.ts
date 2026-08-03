/**
 * Detección genérica de la entidad sobre la que pregunta un administrador.
 *
 * Enfoque deliberado, común a organizaciones y contenido: NO se intenta adivinar
 * el nombre con heurísticas de lenguaje natural (mayúsculas, frases
 * disparadoras). En su lugar se compara el mensaje contra el CATÁLOGO REAL de
 * entidades. Es más fiable —"Art in Technology" no encaja en ningún patrón de
 * nombre propio en español— y no puede inventar entidades: si el término no
 * existe en la base de datos, no hay coincidencia posible.
 *
 * Todas las funciones son puras: reciben el catálogo ya cargado.
 */

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

/** Cuántos mensajes recientes del administrador se escanean por turno. */
const MAX_MESSAGES_SCANNED = 6

/** Cota de identificadores explícitos, para acotar el trabajo posterior. */
const MAX_ENTITY_IDS = 3

/**
 * Longitud mínima de un término para aceptarlo como mención. Evita que
 * entidades con nombres genéricos y muy cortos ("Ax", "IA") se activen con
 * cualquier palabra suelta del mensaje.
 */
const MIN_MENTION_LENGTH = 4

/** Marcas diacríticas combinantes (resultado de normalizar a NFD). */
const COMBINING_DIACRITICS = /[̀-ͯ]/g

/** Identificadores extraídos de la conversación, listos para comparar. */
export interface MentionIdentifiers {
  /** UUIDs escritos literalmente por el administrador. */
  entityIds: string[]
  /** Mensajes normalizados, del más reciente al más antiguo. */
  normalizedMessages: string[]
}

/** Entrada del catálogo: la entidad y los términos por los que se la nombra. */
export interface MentionableEntry<TEntity> {
  id: string
  terms: string[]
  entity: TEntity
}

/**
 * Normaliza para comparar: sin diacríticos, en minúsculas y con cualquier
 * secuencia que no sea letra o dígito convertida en un espacio. Así "Art in
 * Technology", "art-in-technology" (slug) y "ART IN TECHNOLOGY!" colapsan en la
 * misma forma comparable.
 */
export function normalizeForMention(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * ¿El texto contiene el término como secuencia completa de palabras?
 *
 * Se compara sobre las formas normalizadas y con espacios en los extremos, de
 * modo que "Acme" no coincide dentro de "Acmecorp" pero sí en "la empresa Acme".
 */
export function mentionsTerm(normalizedText: string, normalizedTerm: string): boolean {
  if (!normalizedTerm || normalizedTerm.length < MIN_MENTION_LENGTH) return false
  return ` ${normalizedText} `.includes(` ${normalizedTerm} `)
}

/**
 * Extrae de los mensajes recientes lo necesario para detectar menciones,
 * priorizando los mensajes más nuevos.
 *
 * @param recentUserMessages Mensajes del rol "user" en orden cronológico
 *   (el último elemento es el mensaje actual).
 */
export function extractMentionIdentifiers(
  recentUserMessages: string[],
): MentionIdentifiers {
  const scanned = recentUserMessages.slice(-MAX_MESSAGES_SCANNED).reverse()

  const entityIds: string[] = []
  const normalizedMessages: string[] = []

  for (const message of scanned) {
    entityIds.push(...(message.match(UUID_PATTERN) || []).map((id) => id.toLowerCase()))
    const normalized = normalizeForMention(message)
    if (normalized) normalizedMessages.push(normalized)
  }

  return {
    entityIds: Array.from(new Set(entityIds)).slice(0, MAX_ENTITY_IDS),
    normalizedMessages,
  }
}

/** Prepara una entrada de catálogo descartando términos demasiado cortos. */
export function toMentionableEntry<TEntity>(
  id: string,
  terms: Array<string | null | undefined>,
  entity: TEntity,
): MentionableEntry<TEntity> {
  return {
    id,
    terms: terms
      .filter((term): term is string => Boolean(term))
      .map(normalizeForMention)
      .filter((term) => term.length >= MIN_MENTION_LENGTH),
    entity,
  }
}

/**
 * Entidades del catálogo mencionadas en la conversación.
 *
 * Prioriza los mensajes más recientes: una pregunta de seguimiento sobre otra
 * entidad debe ganar a la mencionada tres turnos antes. Dentro del mismo
 * mensaje, gana la coincidencia más larga (si existen "Acme" y "Acme Global",
 * el texto "Acme Global" resuelve la segunda y no ambas).
 */
export function findMentionedEntities<TEntity>(
  identifiers: MentionIdentifiers,
  entries: MentionableEntry<TEntity>[],
): TEntity[] {
  const byId = new Map(entries.map((entry) => [entry.id.toLowerCase(), entry]))
  const matched = new Map<string, TEntity>()

  for (const entityId of identifiers.entityIds) {
    const entry = byId.get(entityId)
    if (entry) matched.set(entry.id, entry.entity)
  }

  for (const normalizedMessage of identifiers.normalizedMessages) {
    const hits = entries
      .map((entry) => {
        const longestHit = entry.terms
          .filter((term) => mentionsTerm(normalizedMessage, term))
          .sort((a, b) => b.length - a.length)[0]
        return longestHit ? { entry, hit: longestHit } : null
      })
      .filter((hit): hit is { entry: MentionableEntry<TEntity>; hit: string } =>
        hit !== null,
      )
      .sort((a, b) => b.hit.length - a.hit.length)

    // Una coincidencia más larga que contiene a otra ("Acme Global" ⊃ "Acme")
    // describe la misma mención: solo se conserva la más específica.
    const acceptedHits: string[] = []
    for (const { entry, hit } of hits) {
      if (acceptedHits.some((accepted) => mentionsTerm(accepted, hit))) continue
      acceptedHits.push(hit)
      matched.set(entry.id, entry.entity)
    }

    // Basta con el mensaje más reciente que mencione alguna entidad.
    if (matched.size > 0) break
  }

  return Array.from(matched.values())
}

/**
 * ¿El mensaje ACTUAL usa vocabulario de un dominio concreto?
 *
 * Sirve para decidir si merece la pena construir un índice comparativo (la
 * consulta más cara de cada módulo) cuando el administrador no ha nombrado
 * ninguna entidad: "¿cuántas empresas hay?", "¿qué cursos tenemos?".
 */
export function mentionsVocabulary(
  recentUserMessages: string[],
  vocabulary: string[],
): boolean {
  const lastMessage = recentUserMessages[recentUserMessages.length - 1]
  if (!lastMessage) return false

  const normalized = normalizeForMention(lastMessage)
  return vocabulary.some((term) => mentionsTerm(normalized, term))
}
