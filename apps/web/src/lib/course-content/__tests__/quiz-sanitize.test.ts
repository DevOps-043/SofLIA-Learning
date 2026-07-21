import { describe, expect, it } from 'vitest'

import { stripQuizAnswerKey } from '../quiz-sanitize'

describe('stripQuizAnswerKey', () => {
  it('removes correctAnswer from a { questions: [] } payload', () => {
    const result = stripQuizAnswerKey({
      totalPoints: 2,
      questions: [
        { id: 'q1', question: 'A?', options: ['x', 'y'], correctAnswer: 'x', points: 1 },
        { id: 'q2', question: 'B?', options: ['1', '2'], correctAnswer: 1, points: 1 },
      ],
    }) as { totalPoints: number; questions: Array<Record<string, unknown>> }

    expect(result.totalPoints).toBe(2)
    expect(result.questions[0]).not.toHaveProperty('correctAnswer')
    expect(result.questions[1]).not.toHaveProperty('correctAnswer')
    // Preserva enunciado y opciones para poder responder.
    expect(result.questions[0].question).toBe('A?')
    expect(result.questions[0].options).toEqual(['x', 'y'])
  })

  it('removes correctAnswer and correct_answer from a bare array payload', () => {
    const result = stripQuizAnswerKey([
      { id: 'q1', correctAnswer: 'x' },
      { id: 'q2', correct_answer: 2 },
    ]) as Array<Record<string, unknown>>

    expect(result[0]).not.toHaveProperty('correctAnswer')
    expect(result[1]).not.toHaveProperty('correct_answer')
  })

  it('parses stringified JSON before stripping', () => {
    const result = stripQuizAnswerKey(
      JSON.stringify({ questions: [{ id: 'q1', correctAnswer: 'x' }] }),
    ) as { questions: Array<Record<string, unknown>> }

    expect(result.questions[0]).not.toHaveProperty('correctAnswer')
  })

  it('returns non-quiz content untouched', () => {
    expect(stripQuizAnswerKey('plain text')).toBe('plain text')
    expect(stripQuizAnswerKey(null)).toBeNull()
  })
})
