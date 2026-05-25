import { describe, expect, it } from 'vitest'
import { sanitizeRichHtml } from '../sanitize-html'

describe('sanitizeRichHtml', () => {
  it('removes executable HTML while preserving course content markup', () => {
    const result = sanitizeRichHtml(`
      <h2 onclick="steal()">Titulo</h2>
      <p style="background:url(javascript:alert(1))">Texto <strong>seguro</strong></p>
      <script>alert("xss")</script>
      <a href="javascript:alert(1)">malicioso</a>
      <a href="https://soflia.com/learn" target="_blank">seguro</a>
      <table><tbody><tr><th>Modulo</th><td>Leccion</td></tr></tbody></table>
    `)

    expect(result).toContain('<h2>Titulo</h2>')
    expect(result).toContain('<strong>seguro</strong>')
    expect(result).toContain('<a>malicioso</a>')
    expect(result).toContain('href="https://soflia.com/learn"')
    expect(result).toContain('<table>')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('style=')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('javascript:')
  })
})
