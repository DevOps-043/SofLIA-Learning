/**
 * Normalización canónica de preguntas de quiz.
 *
 * Curs Engine/CourseForge (y editores externos) envían `correctAnswer` de forma
 * inconsistente respecto al spec (texto exacto de la opción): índices numéricos,
 * letras ("A"/"B"), opciones con prefijo ("A) Verdadero"), o variantes de
 * Verdadero/Falso ("True"/"0"/"v"). Este módulo resuelve `correctAnswer` al
 * **texto exacto** de una opción para que el editor admin lo muestre seleccionado
 * y la calificación del alumno funcione, sin depender de la fuente.
 *
 * Se aplica en el límite de deserialización: importación, carga del editor y
 * lectura del alumno. Es idempotente: re-normalizar contenido ya válido no lo altera.
 */

export interface RawQuizQuestion {
  id?: unknown
  question?: unknown
  questionText?: unknown
  questionType?: unknown
  type?: unknown
  options?: unknown
  correctAnswer?: unknown
  correct_answer?: unknown
  explanation?: unknown
  points?: unknown
}

export interface NormalizedQuizQuestion {
  id: string
  question: string
  questionType: string
  options: string[]
  correctAnswer: string
  explanation: string
  points: number
}

const TRUE_LABEL = 'Verdadero'
const FALSE_LABEL = 'Falso'
const TRUE_TOKENS = new Set(['true', 'verdadero', 'v', '1', 'si', 'sí', 't'])
const FALSE_TOKENS = new Set(['false', 'falso', 'f', '0', 'no'])

// Elimina prefijos de enumeración tipo "A) ", "B. ", "1) ", "(C) " — requiere un
// separador seguido de espacio para no recortar contenido real como "A.I. ...".
function stripEnumPrefix(text: string): string {
  return text.replace(/^\s*\(?[A-Za-z0-9]{1,2}\)?[).\-:]\s+/, '').trim()
}

function normalizeForCompare(text: string): string {
  return stripEnumPrefix(text).replace(/\s+/g, ' ').trim().toLowerCase()
}

// Convierte un token de letra suelto ("B", "(B)", "C)") a índice base-0; null si no aplica.
function bareLetterToIndex(value: string): number | null {
  const match = value.trim().match(/^\(?([A-Za-z])\)?[).\-:]?$/)
  if (!match) return null
  return match[1].toUpperCase().charCodeAt(0) - 65
}

// Letra del prefijo de una opción ("B) Riesgo" -> "B"); null si no tiene prefijo.
function optionPrefixLetter(option: string): string | null {
  const match = option.trim().match(/^\(?([A-Za-z])\)?[).\-:]\s+/)
  return match ? match[1].toUpperCase() : null
}

function resolveTrueFalse(raw: unknown): string {
  if (typeof raw === 'number') return raw === 0 ? TRUE_LABEL : FALSE_LABEL

  const token = normalizeForCompare(String(raw ?? ''))
  if (TRUE_TOKENS.has(token)) return TRUE_LABEL
  if (FALSE_TOKENS.has(token)) return FALSE_LABEL

  // "A"/"B" cuando las opciones de origen venían prefijadas (A) Verdadero, B) Falso)
  const index = bareLetterToIndex(String(raw ?? ''))
  if (index === 0) return TRUE_LABEL
  if (index === 1) return FALSE_LABEL

  return '' // irresoluble: dejar sin seleccionar antes que adivinar
}

function resolveChoice(raw: unknown, options: string[]): string {
  if (typeof raw === 'number') {
    if (options[raw] !== undefined) return options[raw]
  }

  const value = raw === undefined || raw === null ? '' : String(raw)
  if (options.length === 0) return value // short_answer o sin opciones: conservar tal cual

  const exact = options.find((option) => option === value)
  if (exact !== undefined) return exact

  // Letra suelta ("B"): primero por prefijo de opción, luego por posición.
  const letterIndex = bareLetterToIndex(value)
  if (letterIndex !== null) {
    const upper = value.trim().replace(/[^A-Za-z]/g, '').toUpperCase()
    const byPrefix = options.find((option) => optionPrefixLetter(option) === upper)
    if (byPrefix !== undefined) return byPrefix
    if (options[letterIndex] !== undefined) return options[letterIndex]
  }

  // Comparación insensible a prefijo/mayúsculas/espacios.
  const target = normalizeForCompare(value)
  const fuzzy = options.find((option) => normalizeForCompare(option) === target)
  if (fuzzy !== undefined) return fuzzy

  return value // irresoluble: conservar el valor original
}

export function normalizeQuizQuestion(
  raw: RawQuizQuestion,
  index?: number,
): NormalizedQuizQuestion {
  const questionType = String(raw.questionType ?? raw.type ?? 'multiple_choice').toLowerCase()
  const isTrueFalse = questionType === 'true_false'

  const sourceOptions = Array.isArray(raw.options)
    ? raw.options.map((option) => (typeof option === 'string' ? option : String(option)))
    : []
  const rawCorrect = raw.correctAnswer !== undefined ? raw.correctAnswer : raw.correct_answer

  const options = isTrueFalse ? [TRUE_LABEL, FALSE_LABEL] : sourceOptions
  const correctAnswer = isTrueFalse
    ? resolveTrueFalse(rawCorrect)
    : resolveChoice(rawCorrect, options)

  const fallbackId = index !== undefined ? `q-${index}` : `q-${Math.random().toString(36).slice(2, 11)}`

  return {
    id: raw.id ? String(raw.id) : fallbackId,
    question: String(raw.question ?? raw.questionText ?? ''),
    questionType,
    options,
    correctAnswer,
    explanation: String(raw.explanation ?? ''),
    points: Number(raw.points) || 1,
  }
}

export function normalizeQuizQuestions(
  questions: RawQuizQuestion[],
): NormalizedQuizQuestion[] {
  return questions.map((question, index) => normalizeQuizQuestion(question, index))
}
