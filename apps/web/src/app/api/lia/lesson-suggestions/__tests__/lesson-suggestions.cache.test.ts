import { describe, expect, it } from 'vitest'

import {
  computeLessonContentHash,
} from '../lesson-suggestions.cache'
import type { LessonContextSnapshot } from '../lesson-suggestions.types'

function makeSnapshot(
  overrides: Partial<LessonContextSnapshot> = {},
): LessonContextSnapshot {
  return {
    lessonId: '11111111-1111-1111-1111-111111111111',
    lessonTitle: 'Intro a prompts',
    lessonDescription: 'Conceptos base de prompts efectivos',
    courseTitle: 'IA aplicada',
    courseSlug: 'ia-aplicada',
    language: 'es',
    ...overrides,
  }
}

describe('computeLessonContentHash', () => {
  it('returns a stable hash for identical snapshots', () => {
    const snapshot = makeSnapshot()
    expect(computeLessonContentHash(snapshot)).toBe(
      computeLessonContentHash(makeSnapshot()),
    )
  })

  it('changes when language changes', () => {
    const es = computeLessonContentHash(makeSnapshot({ language: 'es' }))
    const en = computeLessonContentHash(makeSnapshot({ language: 'en' }))
    expect(es).not.toBe(en)
  })

  it('changes when lesson description changes', () => {
    const a = computeLessonContentHash(
      makeSnapshot({ lessonDescription: 'Versión A del contenido' }),
    )
    const b = computeLessonContentHash(
      makeSnapshot({ lessonDescription: 'Versión B distinta' }),
    )
    expect(a).not.toBe(b)
  })

  it('changes when activity focus is added', () => {
    const without = computeLessonContentHash(makeSnapshot())
    const withFocus = computeLessonContentHash(
      makeSnapshot({
        activityFocus: {
          title: 'Práctica 1',
          type: 'exercise',
          description: 'Crea un prompt para un caso de soporte',
        },
      }),
    )
    expect(without).not.toBe(withFocus)
  })

  it('produces a 64-character sha256 hex digest', () => {
    expect(computeLessonContentHash(makeSnapshot())).toMatch(/^[a-f0-9]{64}$/)
  })
})
