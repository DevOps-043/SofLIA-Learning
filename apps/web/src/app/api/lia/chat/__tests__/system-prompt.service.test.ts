import { describe, expect, it } from 'vitest'
import { getLIASystemPrompt } from '../system-prompt.service'

describe('lia system-prompt.service', () => {
  it('does not expose database schema context in the final prompt', () => {
    const prompt = getLIASystemPrompt({
      currentPage: '/acme/business-user/dashboard',
      organizationSlug: 'acme',
    })

    expect(prompt).not.toContain('## ESQUEMA DE BASE DE DATOS DE SofLIA')
    expect(prompt).not.toContain('course_lessons')
    expect(prompt).toContain(
      'Nunca expongas detalles tecnicos internos ni su origen.',
    )
  })
})
