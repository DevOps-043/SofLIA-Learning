import { describe, expect, it } from 'vitest'
import { resolveQuizPayload } from '../utils'

const makeQuestion = (id: string) => ({ id, question: 'What?', options: [], correctAnswer: 0 })

describe('resolveQuizPayload', () => {
  it('returns null for empty or invalid input', () => {
    expect(resolveQuizPayload(null)).toBeNull()
    expect(resolveQuizPayload(undefined)).toBeNull()
    expect(resolveQuizPayload([])).toBeNull()
    expect(resolveQuizPayload('')).toBeNull()
    expect(resolveQuizPayload([{ title: 'No id or question field' }])).toBeNull()
  })

  it('parses arrays of questions directly or from JSON strings', () => {
    const questions = [makeQuestion('q1'), makeQuestion('q2')]
    const direct = resolveQuizPayload(questions)
    const fromJson = resolveQuizPayload(JSON.stringify([makeQuestion('q3')]))

    expect(direct?.questions).toHaveLength(2)
    expect(direct?.totalPoints).toBeUndefined()
    expect(fromJson?.questions[0].id).toBe('q3')
  })

  it('parses payload objects with questions and optional total points', () => {
    const payload = { questions: [makeQuestion('q1')], totalPoints: 100 }
    const fromObject = resolveQuizPayload(payload)
    const fromJson = resolveQuizPayload(JSON.stringify({ questions: [makeQuestion('q2')], totalPoints: 50 }))

    expect(fromObject?.questions).toHaveLength(1)
    expect(fromObject?.totalPoints).toBe(100)
    expect(fromJson?.totalPoints).toBe(50)
  })
})
