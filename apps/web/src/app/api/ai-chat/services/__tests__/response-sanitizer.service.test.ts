import { describe, expect, it } from 'vitest'
import {
  cleanMarkdownFromResponse,
  filterSystemPromptFromResponse,
  normalizePlatformLinks,
  sanitizeAssistantResponse,
} from '../response-sanitizer.service'

describe('response-sanitizer.service', () => {
  it('returns a safe fallback when the response leaks system prompt markers', () => {
    const leaked = `Eres SofLIA\nCONTEXTO DE LA PÁGINA ACTUAL\nFORMATO DE RESPUESTAS`

    expect(filterSystemPromptFromResponse(leaked)).toMatch(
      /tuve un problema al procesar la respuesta/i
    )
  })

  it('removes markdown formatting but keeps the text content', () => {
    expect(
      cleanMarkdownFromResponse('## Título\n**texto** con `codigo` y > cita')
    ).toBe('Título\ntexto con codigo y cita')
  })

  it('normalizes relative platform links using allowed origins', () => {
    expect(
      normalizePlatformLinks(
        'Ve al [Dashboard](/dashboard)',
        {
          ALLOWED_ORIGINS: 'https://soflia.test,https://backup.test',
          PUBLIC_APP_URL: 'https://fallback.test',
        } as unknown as NodeJS.ProcessEnv
      )
    ).toBe('Ve al [Dashboard](https://soflia.test/dashboard)')
  })

  it('sanitizes and normalizes in a single pass', () => {
    expect(
      sanitizeAssistantResponse('**Visita** [Perfil](/profile)', {
        PUBLIC_APP_URL: 'https://soflia.test',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe('Visita [Perfil](https://soflia.test/profile)')
  })
})
