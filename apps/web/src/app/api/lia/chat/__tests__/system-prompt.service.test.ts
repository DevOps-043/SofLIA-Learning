import { describe, expect, it } from 'vitest'

import { buildPromptModelProfile } from '@/lib/ai/prompts'

import { getLIASystemPrompt } from '../system-prompt.service'

const googleProfile = buildPromptModelProfile({
  model: 'gemini-3.5-flash',
  provider: 'google',
})
const openAiProfile = buildPromptModelProfile({ model: 'gpt-5.1', provider: 'openai' })

const context = {
  currentPage: '/acme/business-user/dashboard',
  organizationSlug: 'acme',
}

describe('lia system-prompt.service', () => {
  it('does not expose database schema context in the final prompt', () => {
    const prompt = getLIASystemPrompt(googleProfile, context)

    expect(prompt).not.toContain('## ESQUEMA DE BASE DE DATOS DE SofLIA')
    expect(prompt).not.toContain('course_lessons')
    expect(prompt).toContain(
      'Nunca expongas detalles tecnicos internos ni su origen.',
    )
  })

  it('conserva el prompt original de Gemini sin tocar', () => {
    // La variante de Google es texto congelado: si alguien la reescribe al
    // ajustar OpenAI, esta prueba lo detecta.
    const prompt = getLIASystemPrompt(googleProfile, context)

    expect(prompt).toContain('## OVERRIDE DE FLUJO PARA REPORTES TECNICOS')
    expect(prompt).toContain('PROHIBIDO ABSOLUTAMENTE usar emojis')
    expect(prompt).toContain('REGLA DE ORO')
  })

  it('la variante de OpenAI es un texto distinto, no el de Gemini', () => {
    const prompt = getLIASystemPrompt(openAiProfile, context)

    // No arrastra el parche de override ni el enfasis en mayusculas del original.
    expect(prompt).not.toContain('## OVERRIDE DE FLUJO PARA REPORTES TECNICOS')
    expect(prompt).not.toContain('PROHIBIDO ABSOLUTAMENTE')
  })

  it('ambas variantes conservan las reglas de negocio criticas', () => {
    for (const profile of [googleProfile, openAiProfile]) {
      const prompt = getLIASystemPrompt(profile, context)

      expect(prompt).toContain('SofLIA')
      expect(prompt).toContain('[[BUG_REPORT_DRAFT:')
      expect(prompt).toContain('/my-courses')
      // El glosario de pantallas es dato compartido y se prefija con la org.
      expect(prompt).toContain('/acme/business-panel')
    }
  })
})
