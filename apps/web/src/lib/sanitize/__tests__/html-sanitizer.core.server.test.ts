// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { sanitizeHtml } from '../html-sanitizer.core'

describe('note HTML sanitizer in the server runtime', () => {
  it('loads its server dependency and preserves rich note content', () => {
    const content = '<h2>Apuntes</h2><p><strong>Concepto</strong> del curso</p><ul><li>Ejemplo</li></ul>'

    expect(sanitizeHtml(content, { level: 'rich' })).toBe(content)
  })

  it('removes executable HTML while keeping readable notes', () => {
    const result = sanitizeHtml(
      '<p onclick="alert(1)">Apunte</p><script>alert(1)</script><a href="javascript:alert(1)">Recurso</a>',
      { level: 'rich' },
    )

    expect(result).toContain('<p>Apunte</p>')
    expect(result).toContain('Recurso')
    expect(result).not.toMatch(/<script|onclick|javascript:/i)
  })
})
