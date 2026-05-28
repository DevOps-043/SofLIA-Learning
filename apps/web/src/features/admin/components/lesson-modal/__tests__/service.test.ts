import { describe, expect, it } from 'vitest'
import {
  canGenerateLessonAi,
  createLessonFormData,
  formatLessonDuration,
  parseLessonDuration,
  validateLessonForm,
} from '../service'

describe('lesson-modal.service', () => {
  it('crea form data desde la lección o desde instructores por defecto', () => {
    expect(
      createLessonFormData(
        {
          lesson_title: 'Intro',
          lesson_description: null,
          video_provider_id: 'vid',
          video_provider: 'youtube',
          duration_seconds: 120,
          transcript_content: null,
          summary_content: null,
          is_published: true,
          instructor_id: 'instructor-1',
        } as never,
        [],
      ),
    ).toMatchObject({
      lesson_title: 'Intro',
      duration_seconds: 120,
      instructor_id: 'instructor-1',
    })

    expect(createLessonFormData(null, [{ id: 'inst-1', name: 'Ada' }]).instructor_id).toBe(
      'inst-1',
    )
  })

  it('formatea y parsea duración en mm:ss', () => {
    expect(formatLessonDuration(125)).toBe('2:05')
    expect(parseLessonDuration('2:05')).toBe(125)
  })

  it('valida generación AI y formulario', () => {
    expect(canGenerateLessonAi('direct', 'https://video.test/file.mp4')).toBe(true)
    expect(canGenerateLessonAi('youtube', 'https://video.test/file.mp4')).toBe(false)

    expect(
      validateLessonForm({
        lesson_title: 'Intro',
        lesson_description: '',
        video_provider_id: 'vid',
        video_provider: 'youtube',
        duration_seconds: 0,
        transcript_content: '',
        summary_content: '',
        is_published: false,
        instructor_id: '',
      }),
    ).toBe('instructorRequired')
  })
})
