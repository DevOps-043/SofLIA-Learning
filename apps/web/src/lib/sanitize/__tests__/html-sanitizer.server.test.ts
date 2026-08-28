import { describe, expect, it } from 'vitest'

import { RICH_TEXT_CONFIG } from '../html-sanitizer.config'
import { basicServerSanitize } from '../html-sanitizer.server'

describe('basicServerSanitize', () => {
  it('strips inline CSS and hardens rich-note links on the server', () => {
    const result = basicServerSanitize(
      '<p style="text-align: center; color: red" onclick="alert(1)">Hola <a href="https://soflia.ai" target="_blank" rel="noopener noreferrer external">SofLIA</a></p>',
      RICH_TEXT_CONFIG,
    )

    expect(result).toContain('<p>')
    expect(result).toContain(
      '<a href="https://soflia.ai" target="_blank" rel="noopener noreferrer" data-external="true">',
    )
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('style=')
  })

  it('removes unsafe urls while keeping readable link text', () => {
    const result = basicServerSanitize(
      '<a href="javascript:alert(1)">Abrir recurso</a>',
      RICH_TEXT_CONFIG,
    )

    expect(result).toBe('<a>Abrir recurso</a>')
  })
})
