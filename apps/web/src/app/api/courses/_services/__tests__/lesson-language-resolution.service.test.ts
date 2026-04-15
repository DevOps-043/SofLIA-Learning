import { describe, expect, it } from 'vitest'

import { resolveLessonContentWithFallback } from '../lesson-language-resolution.service'

describe('resolveLessonContentWithFallback', () => {
  it('preserves base identifiers when translated lessons use different ids', () => {
    const resolved = resolveLessonContentWithFallback({
      requestedLanguage: 'en',
      baseLesson: {
        lesson_id: 'base-lesson-id',
        module_id: 'base-module-id',
        lesson_title: 'Titulo base',
        lesson_description: 'Descripcion base',
        transcript_content: 'Transcripcion base',
        summary_content: 'Resumen base',
      },
      translatedLesson: {
        lesson_id: 'translated-lesson-id',
        module_id: 'translated-module-id',
        lesson_title: 'Translated title',
        lesson_description: 'Translated description',
        transcript_content: 'Translated transcript',
        summary_content: 'Translated summary',
      },
    })

    expect(resolved.lesson.lesson_id).toBe('base-lesson-id')
    expect(resolved.lesson.module_id).toBe('base-module-id')
    expect(resolved.lesson.lesson_title).toBe('Translated title')
    expect(resolved.lesson.lesson_description).toBe('Translated description')
    expect(resolved.lesson.transcript_content).toBe('Translated transcript')
    expect(resolved.lesson.summary_content).toBe('Translated summary')
    expect(resolved.translationContext.usedFallback).toBe(false)
    expect(resolved.translationContext.resolvedLanguage).toBe('en')
  })

  it('falls back to base translatable content when translated fields are missing', () => {
    const resolved = resolveLessonContentWithFallback({
      requestedLanguage: 'pt',
      baseLesson: {
        lesson_id: 'base-lesson-id',
        module_id: 'base-module-id',
        lesson_title: 'Titulo base',
        lesson_description: 'Descricao base',
        transcript_content: 'Transcricao base',
        summary_content: 'Resumo base',
      },
      translatedLesson: {
        lesson_id: 'translated-lesson-id',
        module_id: 'translated-module-id',
        lesson_title: '',
        lesson_description: null,
        transcript_content: '',
        summary_content: null,
      },
    })

    expect(resolved.lesson.lesson_id).toBe('base-lesson-id')
    expect(resolved.lesson.module_id).toBe('base-module-id')
    expect(resolved.lesson.lesson_title).toBe('Titulo base')
    expect(resolved.lesson.lesson_description).toBe('Descricao base')
    expect(resolved.lesson.transcript_content).toBe('Transcricao base')
    expect(resolved.lesson.summary_content).toBe('Resumo base')
    expect(resolved.translationContext.usedFallback).toBe(true)
    expect(resolved.translationContext.missingPieces).toEqual([
      'lesson_text',
      'transcript',
      'summary',
    ])
  })
})
