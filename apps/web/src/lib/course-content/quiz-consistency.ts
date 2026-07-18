/**
 * Detección de inconsistencias entre el answer key de una pregunta de quiz y
 * su explicación.
 *
 * Los generadores externos de contenido (Curs Engine/CourseForge) a veces
 * producen preguntas donde `correctAnswer` apunta a una opción distinta de la
 * que la propia explicación declara como correcta ("La opción correcta es B...").
 * Ese contenido califica mal al alumno y contradice el feedback visible.
 *
 * Este módulo NO auto-repara (no hay forma fiable de saber si el error está en
 * el key o en la explicación): detecta el conflicto para que un humano lo
 * corrija en la revisión del curso antes de publicarlo.
 */

import { bareLetterToIndex, normalizeForCompare, optionPrefixLetter } from './quiz-normalize'

export interface QuizAnswerKeyConflict {
  /** Opción que la explicación declara como correcta */
  declaredCorrectOption: string
  /** Opción marcada como correcta en el answer key */
  storedCorrectAnswer: string
}

interface QuizQuestionForConsistency {
  correctAnswer?: string | number | null
  explanation?: string | null
  options?: string[] | null
  questionType?: string | null
}

// Declaraciones explícitas de respuesta correcta por letra: "la opción correcta
// es B", "the correct answer is (C)", "a resposta correta é a letra D".
const LETTER_DECLARATION_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:opci[oó]n|respuesta|alternativa)\s+correcta\s+es\s+(?:la\s+)?(?:letra\s+|opci[oó]n\s+|alternativa\s+)?[«"“']?\(?([A-Za-z])\)?[»"”'.,;:\s]/i,
  /correct\s+(?:answer|option)\s+is\s+(?:option\s+|letter\s+)?[«"“']?\(?([A-Za-z])\)?[»"”'.,;:\s]/i,
  /(?:op[cç][aã]o|resposta|alternativa)\s+correta\s+é\s+(?:a\s+)?(?:letra\s+|op[cç][aã]o\s+|alternativa\s+)?[«"“']?\(?([A-Za-z])\)?[»"”'.,;:\s]/i,
]

// Declaraciones por texto de opción entre comillas: la opción correcta es «El Challenger».
const QUOTED_DECLARATION_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:opci[oó]n|respuesta|alternativa)\s+correcta\s+es\s+[«"“']([^»"”']{2,80})[»"”']/i,
  /correct\s+(?:answer|option)\s+is\s+[«"“']([^»"”']{2,80})[»"”']/i,
  /(?:op[cç][aã]o|resposta|alternativa)\s+correta\s+é\s+[«"“']([^»"”']{2,80})[»"”']/i,
]

function resolveDeclaredOption(explanation: string, options: string[]): string | null {
  for (const pattern of LETTER_DECLARATION_PATTERNS) {
    const match = explanation.match(pattern)
    if (match) {
      const letter = match[1].toUpperCase()

      // Prioridad al prefijo explícito de la opción ("B) Riesgo") por si el
      // orden de las opciones no coincide con el alfabético; después posición.
      const byPrefix = options.find((option) => optionPrefixLetter(option) === letter)
      if (byPrefix !== undefined) {
        return byPrefix
      }

      const index = bareLetterToIndex(letter)
      if (index !== null && options[index] !== undefined) {
        return options[index]
      }
    }
  }

  for (const pattern of QUOTED_DECLARATION_PATTERNS) {
    const match = explanation.match(pattern)
    if (match) {
      const target = normalizeForCompare(match[1])
      const option = options.find((candidate) => normalizeForCompare(candidate) === target)
      if (option !== undefined) {
        return option
      }
    }
  }

  return null
}

/**
 * Devuelve el conflicto entre answer key y explicación, o `null` si no hay
 * declaración explícita en la explicación o si ambas coinciden. Solo reporta
 * cuando la opción declarada se resuelve sin ambigüedad a una opción real.
 */
export function findQuizAnswerKeyConflict(
  question: QuizQuestionForConsistency,
): QuizAnswerKeyConflict | null {
  const explanation = typeof question.explanation === 'string' ? question.explanation : ''
  const options = Array.isArray(question.options) ? question.options : []

  if (!explanation || options.length < 2 || question.questionType === 'true_false') {
    return null
  }

  const storedCorrectAnswer =
    typeof question.correctAnswer === 'number'
      ? options[question.correctAnswer]
      : question.correctAnswer

  if (typeof storedCorrectAnswer !== 'string' || !storedCorrectAnswer.trim()) {
    return null
  }

  const declaredCorrectOption = resolveDeclaredOption(explanation, options)

  if (
    declaredCorrectOption === null ||
    normalizeForCompare(declaredCorrectOption) === normalizeForCompare(storedCorrectAnswer)
  ) {
    return null
  }

  return {
    declaredCorrectOption,
    storedCorrectAnswer,
  }
}
