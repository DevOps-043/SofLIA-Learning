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
      'es',
    )

    expect(prompt).toContain('Mi perfil')
    expect(prompt).toContain('marketing')
  })

  it('builds the course prompt with transcript, metadata, and verified duration rules', () => {
    const prompt = getContextPrompt(
      'course',
      'Ana',
      {
        courseTitle: 'Curso de IA',
        moduleTitle: 'Modulo 1',
        lessonTitle: 'Leccion 1',
        transcriptContent: 'Texto del video',
        durationSeconds: 435,
        totalDurationMinutes: 17,
      },
      undefined,
      undefined,
      'operations',
      'es',
    )

    expect(prompt).toContain('Curso de IA')
    expect(prompt).toContain('Texto del video')
    expect(prompt).toContain('Modulo 1')
    expect(prompt).toContain('Duracion total de la leccion: 17 minutos')
    expect(prompt).toContain(
      'nunca infieras la duracion desde timestamps de la transcripcion',
    )
  })
})
