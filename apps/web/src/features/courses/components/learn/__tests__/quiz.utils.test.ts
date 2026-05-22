import { describe, it, expect } from 'vitest'
import {
  isQuizAnswerCorrect,
  mapAnswerIndexesToOptionText,
  normalizeQuizQuestions,
  calculateQuizResults,
  shuffleQuizQuestions,
  type QuizQuestion,
} from '../quiz.utils'

const makeQuestion = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: 'q1',
  question: '¿Cuál es la capital de Francia?',
  options: ['Madrid', 'Paris', 'Londres'],
  correctAnswer: 1,
  ...overrides,
})

describe('isQuizAnswerCorrect', () => {
  describe('numeric answers', () => {
    it('returns true when index matches numeric correctAnswer', () => {
      const q = makeQuestion({ correctAnswer: 1 })
      expect(isQuizAnswerCorrect(q, 1)).toBe(true)
    })

    it('returns false when index does not match', () => {
      const q = makeQuestion({ correctAnswer: 1 })
      expect(isQuizAnswerCorrect(q, 0)).toBe(false)
    })

    it('returns true when selected option text matches string correctAnswer', () => {
      const q = makeQuestion({ correctAnswer: 'Paris' })
      expect(isQuizAnswerCorrect(q, 1)).toBe(true)
    })

    it('is case-insensitive when matching string correctAnswer', () => {
      const q = makeQuestion({ correctAnswer: 'paris' })
      expect(isQuizAnswerCorrect(q, 1)).toBe(true)
    })
  })

  describe('string answers', () => {
    it('returns true when string matches string correctAnswer', () => {
      const q = makeQuestion({ correctAnswer: 'Paris' })
      expect(isQuizAnswerCorrect(q, 'Paris')).toBe(true)
    })

    it('is case-insensitive for string answers', () => {
      const q = makeQuestion({ correctAnswer: 'Paris' })
      expect(isQuizAnswerCorrect(q, 'paris')).toBe(true)
    })

    it('returns false for wrong string answer', () => {
      const q = makeQuestion({ correctAnswer: 'Paris' })
      expect(isQuizAnswerCorrect(q, 'Madrid')).toBe(false)
    })

    it('returns true when string matches option at numeric correctAnswer index', () => {
      const q = makeQuestion({ correctAnswer: 1 })
      expect(isQuizAnswerCorrect(q, 'Paris')).toBe(true)
    })
  })

  describe('true_false questions', () => {
    const tfQuestion = makeQuestion({
      questionType: 'true_false',
      options: ['Verdadero', 'Falso'],
      correctAnswer: 'verdadero',
    })

    it('returns true for "verdadero" string answer', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 'verdadero')).toBe(true)
    })

    it('returns true for "true" normalized to verdadero', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 'true')).toBe(true)
    })

    it('returns false for "falso" answer', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 'falso')).toBe(false)
    })

    it('returns false for "false" answer', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 'false')).toBe(false)
    })

    it('returns true when selected index maps to correct true_false option', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 0)).toBe(true)
    })

    it('returns false when selected index maps to wrong true_false option', () => {
      expect(isQuizAnswerCorrect(tfQuestion, 1)).toBe(false)
    })
  })
})

describe('normalizeQuizQuestions', () => {
  it('leaves non-true_false questions unchanged', () => {
    const q = makeQuestion({ questionType: 'multiple_choice' })
    expect(normalizeQuizQuestions([q])[0]).toEqual(q)
  })

  it('replaces invalid options for true_false questions with [Verdadero, Falso]', () => {
    const q = makeQuestion({
      questionType: 'true_false',
      options: ['Yes', 'No'],
    })
    const result = normalizeQuizQuestions([q])
    expect(result[0].options).toEqual(['Verdadero', 'Falso'])
  })

  it('keeps valid [Verdadero, Falso] options unchanged', () => {
    const q = makeQuestion({
      questionType: 'true_false',
      options: ['Verdadero', 'Falso'],
    })
    const result = normalizeQuizQuestions([q])
    expect(result[0].options).toEqual(['Verdadero', 'Falso'])
  })

  it('handles empty array', () => {
    expect(normalizeQuizQuestions([])).toEqual([])
  })
})

describe('shuffleQuizQuestions', () => {
  it('shuffles non-true_false options and remaps numeric correctAnswer', () => {
    const q = makeQuestion({
      options: ['Madrid', 'Paris', 'Londres'],
      correctAnswer: 1,
    })

    const result = shuffleQuizQuestions([q], () => 0)

    expect(result[0].options).toEqual(['Paris', 'Londres', 'Madrid'])
    expect(result[0].correctAnswer).toBe(0)
    expect(isQuizAnswerCorrect(result[0], 'Paris')).toBe(true)
  })

  it('does not shuffle true_false questions', () => {
    const q = makeQuestion({
      questionType: 'true_false',
      options: ['Verdadero', 'Falso'],
      correctAnswer: 0,
    })

    const result = shuffleQuizQuestions([q], () => 0)

    expect(result[0]).toEqual(q)
  })
})

describe('mapAnswerIndexesToOptionText', () => {
  it('converts saved numeric answers to option text for order-independent review', () => {
    const question = makeQuestion({
      id: 'q1',
      options: ['Madrid', 'Paris', 'Londres'],
    })

    expect(mapAnswerIndexesToOptionText([question], { q1: 1 })).toEqual({
      q1: 'Paris',
    })
  })

  it('keeps string answers unchanged', () => {
    const question = makeQuestion()

    expect(mapAnswerIndexesToOptionText([question], { q1: 'Paris' })).toEqual({
      q1: 'Paris',
    })
  })
})

describe('calculateQuizResults', () => {
  it('counts correct answers', () => {
    const questions: QuizQuestion[] = [
      makeQuestion({ id: 'q1', correctAnswer: 1, points: 1 }),
      makeQuestion({ id: 'q2', correctAnswer: 0, points: 2 }),
    ]
    const answers = { q1: 1, q2: 0 }
    const result = calculateQuizResults(questions, answers)
    expect(result.correctCount).toBe(2)
    expect(result.pointsEarned).toBe(3)
  })

  it('returns 0 for all wrong answers', () => {
    const questions: QuizQuestion[] = [makeQuestion({ id: 'q1', correctAnswer: 1 })]
    const result = calculateQuizResults(questions, { q1: 2 })
    expect(result.correctCount).toBe(0)
    expect(result.pointsEarned).toBe(0)
  })

  it('handles unanswered questions gracefully', () => {
    const questions: QuizQuestion[] = [makeQuestion({ id: 'q1', correctAnswer: 1 })]
    const result = calculateQuizResults(questions, {})
    expect(result.correctCount).toBe(0)
  })

  it('defaults to 1 point per question when points is not set', () => {
    const questions: QuizQuestion[] = [makeQuestion({ id: 'q1', correctAnswer: 1, points: undefined })]
    const result = calculateQuizResults(questions, { q1: 1 })
    expect(result.pointsEarned).toBe(1)
  })
})
