import type { AdminLookupIdentifiers } from './types'

/**
 * Extracción de identificadores de usuario (email, UUID, nombre) desde los
 * mensajes recientes del admin. Funciones puras, sin acceso a datos.
 *
 * Se escanean varios mensajes (no solo el último) para que preguntas de
 * seguimiento como "¿y su última conexión?" sigan resolviendo al mismo usuario.
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

/** Texto entre comillas dobles, simples tipográficas o angulares: alta confianza. */
const QUOTED_PATTERN = /["“”«']([^"“”«»']{2,80})["“”»']/g

/**
 * Secuencias de 2 a 4 palabras capitalizadas (con acentos y conectores como
 * "de", "del", "la"): heurística de nombre propio en lenguaje natural.
 */
const CAPITALIZED_NAME_PATTERN =
  /\b[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+(?:\s+(?:de|del|la|las|los|da|dos|van|von)\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+|\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'-]+){1,3}/g

/**
 * Palabras capitalizadas frecuentes al inicio de frase que NO forman parte de
 * un nombre propio ("Hola Juan Pérez" → "Juan Pérez").
 */
const LEADING_STOPWORDS = new Set([
  'hola', 'buenos', 'buenas', 'oye', 'dime', 'dame', 'muestra', 'muestrame',
  'muéstrame', 'busca', 'buscame', 'búscame', 'quien', 'quién', 'que', 'qué',
  'cual', 'cuál', 'como', 'cómo', 'cuanto', 'cuánto', 'donde', 'dónde',
  'necesito', 'quiero', 'puedes', 'podrias', 'podrías', 'ayudame', 'ayúdame',
  'soflia', 'lia', 'sobre', 'usuario', 'usuaria', 'el', 'la', 'los', 'las',
  'por', 'favor', 'gracias', 'ok', 'listo', 'ahora', 'tambien', 'también',
])

/**
 * Frases que introducen a la persona buscada. Permiten captar el nombre aunque
 * el admin escriba en minúsculas ("dame el dossier de maria domenzain"), caso
 * que el patrón de capitalización no cubre.
 *
 * Captura hasta 4 palabras tras el disparador; las palabras vacías finales se
 * podan después, de modo que "de maria domenzain y su progreso" → "maria
 * domenzain".
 */
const TRIGGER_NAME_PATTERN = new RegExp(
  String.raw`(?:usuari[oa]|alumn[oa]|emplead[oa]|persona|dossier|expediente|consulta(?:\s+global)?|informaci[oó]n|progreso|datos)\s+` +
    String.raw`(?:de(?:l)?\s+|sobre\s+|acerca\s+de\s+|llamad[oa]\s+)?` +
    String.raw`((?:[a-záéíóúñüA-ZÁÉÍÓÚÑÜ][\wáéíóúñü'-]*)(?:\s+[a-záéíóúñüA-ZÁÉÍÓÚÑÜ][\wáéíóúñü'-]*){0,3})`,
  'gi',
)

/**
 * Palabras que nunca forman parte de un nombre: se podan de los extremos de lo
 * capturado por el disparador.
 */
const NAME_BOUNDARY_STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'su', 'sus', 'que', 'qué',
  'en', 'con', 'para', 'por', 'me', 'le', 'lo', 'un', 'una', 'global', 'completo',
  'completa', 'usuario', 'usuaria', 'progreso', 'datos', 'dossier', 'expediente',
  'informacion', 'información', 'plataforma', 'organizacion', 'organización',
  'cursos', 'lecciones', 'ultima', 'última', 'conexion', 'conexión', 'actividad',
])

/** Cota superior de identificadores por tipo, para acotar consultas a la BD. */
const MAX_IDENTIFIERS_PER_TYPE = 3

/** Cuántos mensajes recientes del usuario se escanean por turno. */
const MAX_MESSAGES_SCANNED = 6

function dedupePreservingOrder(values: string[]): string[] {
  return Array.from(new Set(values))
}

/**
 * Elimina comodines de LIKE para que los identificadores puedan usarse de
 * forma segura en filtros ilike sin inyectar patrones.
 */
export function stripLikeWildcards(value: string): string {
  return value.replace(/[%_]/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function extractQuotedNames(message: string): string[] {
  const names: string[] = []
  for (const match of message.matchAll(QUOTED_PATTERN)) {
    const candidate = match[1].trim()
    // Un nombre citado debe tener letras y no ser un email/UUID (esos ya se capturan aparte)
    if (/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(candidate) && !candidate.includes('@')) {
      names.push(candidate)
    }
  }
  return names
}

/** Poda palabras vacías de los extremos de un nombre capturado. */
function trimStopwords(words: string[]): string[] {
  const trimmed = [...words]

  while (trimmed.length > 0 && NAME_BOUNDARY_STOPWORDS.has(trimmed[0].toLowerCase())) {
    trimmed.shift()
  }
  while (
    trimmed.length > 0 &&
    NAME_BOUNDARY_STOPWORDS.has(trimmed[trimmed.length - 1].toLowerCase())
  ) {
    trimmed.pop()
  }

  return trimmed
}

/**
 * Nombres introducidos por una frase disparadora. Cubre el caso en minúsculas,
 * que la heurística de capitalización no detecta.
 */
function extractTriggeredNames(message: string): string[] {
  const names: string[] = []

  for (const match of message.matchAll(TRIGGER_NAME_PATTERN)) {
    const words = trimStopwords(match[1].split(/\s+/).filter(Boolean))
    if (words.length > 0) {
      names.push(words.join(' '))
    }
  }

  return names
}

function extractCapitalizedNames(message: string): string[] {
  const names: string[] = []
  for (const match of message.matchAll(CAPITALIZED_NAME_PATTERN)) {
    const words = match[0].split(/\s+/)
    // Descarta palabras iniciales que son arranque de frase, no nombre
    while (words.length > 0 && LEADING_STOPWORDS.has(words[0].toLowerCase())) {
      words.shift()
    }
    if (words.length >= 2) {
      names.push(words.join(' '))
    }
  }
  return names
}

/**
 * Extrae identificadores de usuario de los mensajes recientes del admin,
 * priorizando los mensajes más nuevos.
 *
 * @param recentUserMessages Mensajes del rol "user" en orden cronológico
 *   (el último elemento es el mensaje actual).
 */
export function extractLookupIdentifiers(
  recentUserMessages: string[],
): AdminLookupIdentifiers {
  const scanned = recentUserMessages.slice(-MAX_MESSAGES_SCANNED).reverse()

  const emails: string[] = []
  const userIds: string[] = []
  const names: string[] = []

  for (const message of scanned) {
    emails.push(
      ...(message.match(EMAIL_PATTERN) || []).map((email) => email.toLowerCase()),
    )
    userIds.push(
      ...(message.match(UUID_PATTERN) || []).map((id) => id.toLowerCase()),
    )
    names.push(
      ...extractQuotedNames(message),
      ...extractCapitalizedNames(message),
      ...extractTriggeredNames(message),
    )
  }

  const cleanNames = dedupePreservingOrder(
    names.map(stripLikeWildcards).filter((name) => name.length >= 3),
  )

  return {
    emails: dedupePreservingOrder(emails).slice(0, MAX_IDENTIFIERS_PER_TYPE),
    userIds: dedupePreservingOrder(userIds).slice(0, MAX_IDENTIFIERS_PER_TYPE),
    names: cleanNames.slice(0, MAX_IDENTIFIERS_PER_TYPE),
  }
}

export function hasAnyIdentifier(identifiers: AdminLookupIdentifiers): boolean {
  return (
    identifiers.emails.length > 0 ||
    identifiers.userIds.length > 0 ||
    identifiers.names.length > 0
  )
}
