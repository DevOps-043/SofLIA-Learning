import { describe, expect, it } from 'vitest'
import { getContextPrompt } from '../system-prompt.service'

describe('system-prompt.service', () => {
  it('falls back to the general context and includes page information', () => {
    const prompt = getContextPrompt(
      'unknown-context',
      'Ana',
      undefined,
      undefined,
      {
        pathname: '/profile',
        detectedArea: 'profile',
        description: 'Perfil del usuario',
        pageTitle: 'Mi perfil',
      },
      'marketing',
      'es'
    )

    expect(prompt).toContain('Mi perfil')
    expect(prompt).toContain('marketing')
  })

  it('builds the course prompt with transcript and lesson metadata', () => {
    const prompt = getContextPrompt(
      'course',
      'Ana',
      {
        courseTitle: 'Curso de IA',
        moduleTitle: 'Módulo 1',
        lessonTitle: 'Lección 1',
        transcriptContent: 'Texto del video',
      },
      undefined,
      undefined,
      'operations',
      'es'
    )

    expect(prompt).toContain('Curso de IA')
    expect(prompt).toContain('Texto del video')
    expect(prompt).toContain('Módulo 1')
  })
})
