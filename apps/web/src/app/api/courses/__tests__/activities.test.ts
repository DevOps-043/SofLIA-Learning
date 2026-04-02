import { describe, expect, it } from 'vitest'

import {
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from '@/lib/course-content'

describe('Course content normalization smoke', () => {
  it('normalizes activity_content when the payload is a JSON string', () => {
    const result = normalizeLessonActivityRecord({
      activity_content: JSON.stringify({ questions: [{ id: 'q1' }] }),
      activity_type: 'quiz',
    })

    expect(result.activity_content).toEqual({ questions: [{ id: 'q1' }] })
  })

  it('normalizes material content into display-safe text', () => {
    const result = normalizeLessonMaterialRecord({
      content_data: JSON.stringify({ content: 'Material del curso' }),
      material_description: null,
      material_type: 'article',
    })

    expect(result.content_data).toBe('Material del curso')
  })

  it('handles nullish payloads without throwing', () => {
    expect(() =>
      normalizeLessonActivityRecord({
        activity_content: null,
        activity_type: 'exercise',
      })
    ).not.toThrow()

    expect(() =>
      normalizeLessonMaterialRecord({
        content_data: undefined,
        material_description: undefined,
        material_type: 'article',
      })
    ).not.toThrow()
  })
})
