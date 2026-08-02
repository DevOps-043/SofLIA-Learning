import { describe, expect, it } from 'vitest'

import { buildPromptModelProfile, selectPromptVariant } from '../prompt-variants'

describe('perfil del modelo', () => {
  it('detecta el razonamiento interno por familia de modelo', () => {
    expect(
      buildPromptModelProfile({ model: 'gpt-5.1', provider: 'openai' }).reasonsInternally,
    ).toBe(true)
    expect(
      buildPromptModelProfile({ model: 'o3-mini', provider: 'openai' }).reasonsInternally,
    ).toBe(true)
    expect(
      buildPromptModelProfile({ model: 'gpt-4.1-mini', provider: 'openai' }).reasonsInternally,
    ).toBe(false)
    expect(
      buildPromptModelProfile({ model: 'gemini-3.5-flash', provider: 'google' })
        .reasonsInternally,
    ).toBe(true)
  })

  it('un thinkingLevel "off" desactiva el razonamiento interno aunque el modelo lo soporte', () => {
    // Con thinking apagado el modelo NO delibera, asi que la variante SI debe
    // pedir razonamiento por texto.
    expect(
      buildPromptModelProfile({
        model: 'gemini-3.5-flash',
        provider: 'google',
        thinkingLevel: 'off',
      }).reasonsInternally,
    ).toBe(false)

    expect(
      buildPromptModelProfile({
        model: 'gpt-5.1',
        provider: 'openai',
        thinkingLevel: 'off',
      }).reasonsInternally,
    ).toBe(false)
  })
})

describe('seleccion de variante', () => {
  const variants = {
    google: (name: string) => `google:${name}`,
    openai: (_profile: ReturnType<typeof buildPromptModelProfile>, name: string) =>
      `openai:${name}`,
  }

  it('usa la variante de Google para un modelo de Gemini', () => {
    const profile = buildPromptModelProfile({
      model: 'gemini-3.5-flash',
      provider: 'google',
    })

    expect(selectPromptVariant<[string]>(profile, variants, 'x')).toBe('google:x')
  })

  it('usa la variante de OpenAI para un modelo de OpenAI', () => {
    const profile = buildPromptModelProfile({ model: 'gpt-5.1', provider: 'openai' })

    expect(selectPromptVariant<[string]>(profile, variants, 'x')).toBe('openai:x')
  })

  it('pasa los argumentos a la variante elegida', () => {
    const profile = buildPromptModelProfile({ model: 'gpt-5.1', provider: 'openai' })

    expect(selectPromptVariant<[string]>(profile, variants, 'contenido')).toContain(
      'contenido',
    )
  })
})
