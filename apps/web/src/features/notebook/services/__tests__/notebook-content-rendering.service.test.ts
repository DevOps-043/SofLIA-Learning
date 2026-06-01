import { describe, expect, it } from 'vitest'

import {
  getNotebookPlainText,
  sanitizeNotebookRichContent,
} from '../notebook-content-rendering.service'

describe('notebook-content-rendering.service', () => {
  it('preserves safe note formatting for notebook rendering', () => {
    const result = sanitizeNotebookRichContent(
      '<h2>Sintesis</h2><p>Lee <strong>esto</strong></p><ul><li>Punto clave</li></ul>',
    )

    expect(result).toContain('<h2>Sintesis</h2>')
    expect(result).toContain('<strong>esto</strong>')
    expect(result).toContain('<li>Punto clave</li>')
  })

  it('removes executable markup and unsafe link protocols', () => {
    const result = sanitizeNotebookRichContent(
      '<p onclick="alert(1)">Hola</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
    )

    expect(result).toContain('<p>Hola</p>')
    expect(result).toContain('link')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('javascript:')
  })

  it('renders legacy markdown notes as formatted html', () => {
    const result = sanitizeNotebookRichContent(
      'Hola Pedro, revisa **Fundamentos de IA Generativa** desde el [Dashboard](/org/business-user/dashboard).',
    )

    expect(result).toContain('<strong>Fundamentos de IA Generativa</strong>')
    expect(result).toContain(
      '<a href="/org/business-user/dashboard">Dashboard</a>',
    )
    expect(result).not.toContain('**Fundamentos de IA Generativa**')
    expect(result).not.toContain('[Dashboard]')
  })

  it('extracts readable plain text for copy fallbacks', () => {
    expect(getNotebookPlainText('<p>Hola <strong>equipo</strong></p>')).toBe(
      'Hola equipo',
    )
  })
})
