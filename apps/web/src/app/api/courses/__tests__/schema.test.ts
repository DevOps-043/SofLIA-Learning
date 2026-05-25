import { describe, expect, it } from 'vitest'

import {
  courseActivityValidationSchema,
  noteCreateSchema,
  questionCreateSchema,
  quizSubmitSchema,
  reactionToggleSchema,
  responseCreateSchema,
} from '../_schemas'

describe('courses API schemas', () => {
  it('validates question and response content contracts', () => {
    expect(
      questionCreateSchema.safeParse({
        content: 'Como aplico esto en mi trabajo?',
        title: '',
      }).success,
    ).toBe(true)

    expect(
      responseCreateSchema.safeParse({
        content: 'Puedes empezar con un ejemplo pequeno.',
      }).success,
    ).toBe(true)

    expect(questionCreateSchema.safeParse({ content: '   ' }).success).toBe(false)
    expect(responseCreateSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('limits reactions to the supported set and defaults toggle action', () => {
    const parsed = reactionToggleSchema.safeParse({ reaction_type: 'like' })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.action).toBe('toggle')
    }

    expect(
      reactionToggleSchema.safeParse({ reaction_type: 'angry' }).success,
    ).toBe(false)
  })

  it('requires quiz answers, quiz data, and a material or activity target', () => {
    const validQuiz = {
      answers: { q1: 1 },
      materialId: 'material-1',
      quizData: [{ id: 'q1', correctAnswer: 1, options: ['A', 'B'] }],
    }

    expect(quizSubmitSchema.safeParse(validQuiz).success).toBe(true)
    expect(
      quizSubmitSchema.safeParse({
        answers: { q1: 1 },
        quizData: [{ id: 'q1' }],
      }).success,
    ).toBe(false)
  })

  it('keeps activity validation permissive for existing submissions', () => {
    expect(courseActivityValidationSchema.safeParse({}).success).toBe(true)
    expect(
      courseActivityValidationSchema.safeParse({
        responseText: 'Revision lista',
        responsePayload: { answers: { field1: 'Valor' } },
      }).success,
    ).toBe(true)
  })

  it('requires note content and validates supported note sources', () => {
    expect(
      noteCreateSchema.safeParse({
        note_content: '<p>Idea clave</p>',
        source_type: 'manual',
      }).success,
    ).toBe(true)

    expect(noteCreateSchema.safeParse({ note_content: '' }).success).toBe(false)
    expect(
      noteCreateSchema.safeParse({
        note_content: 'Contenido',
        source_type: 'auto',
      }).success,
    ).toBe(false)
  })
})
