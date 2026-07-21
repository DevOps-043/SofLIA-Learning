import { describe, expect, it } from 'vitest'

import {
  gradeQuiz,
  resolveGradableQuizQuestions,
} from '../grade-quiz.service'

// Contenido tal como se almacena en BD (con la clave de respuestas).
const STORED_QUIZ = {
  totalPoints: 2,
  questions: [
    { id: 'q1', question: 'Capital de Francia?', options: ['Madrid', 'Paris', 'Roma'], correctAnswer: 'Paris', points: 1 },
    { id: 'q2', question: '2 + 2?', options: ['3', '4'], correctAnswer: 1, points: 1 },
  ],
}

describe('resolveGradableQuizQuestions', () => {
  it('resolves the answer key from stored content (text or index)', () => {
    const questions = resolveGradableQuizQuestions(STORED_QUIZ)
    expect(questions).toHaveLength(2)
    expect(questions[0].correctAnswer).toBe('Paris')
    // El índice numérico se resuelve al texto exacto de la opción.
    expect(questions[1].correctAnswer).toBe('4')
  })

  it('returns [] for non-quiz content', () => {
    expect(resolveGradableQuizQuestions('not a quiz')).toEqual([])
    expect(resolveGradableQuizQuestions(null)).toEqual([])
  })
})

describe('gradeQuiz', () => {
  const questions = resolveGradableQuizQuestions(STORED_QUIZ)

  it('grades a fully correct submission (index-based answers)', () => {
    const result = gradeQuiz(questions, { q1: 1, q2: 1 })
    expect(result.correctAnswers).toBe(2)
    expect(result.percentageScore).toBe(100)
    expect(result.isPassed).toBe(true)
    expect(result.perQuestion.every((q) => q.isCorrect)).toBe(true)
  })

  it('grades a wrong submission as failing', () => {
    const result = gradeQuiz(questions, { q1: 0, q2: 0 })
    expect(result.correctAnswers).toBe(0)
    expect(result.percentageScore).toBe(0)
    expect(result.isPassed).toBe(false)
  })

  it('is immune to a forged answer key in the answers map', () => {
    // El grader solo lee las preguntas del servidor; cualquier clave inyectada por
    // el cliente en `answers` es ignorada (answers es id -> opción seleccionada).
    const result = gradeQuiz(questions, {
      q1: 0,
      q2: 0,
      correctAnswer: 'Paris',
    } as unknown as Record<string, string | number>)
    expect(result.percentageScore).toBe(0)
  })

  it('reveals the correct answer per question only in the result', () => {
    const result = gradeQuiz(questions, { q1: 0, q2: 1 })
    const q1 = result.perQuestion.find((q) => q.questionId === 'q1')
    expect(q1?.isCorrect).toBe(false)
    expect(q1?.correctAnswer).toBe('Paris')
  })
})
