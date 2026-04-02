import { describe, expect, it } from 'vitest'
import {
  enhancedSanitizeHTML,
  extractTextFromHTML,
  isHTMLSafe,
  sanitizePlainText,
} from '../enhanced-dom-purify'

describe('enhancedSanitizeHTML', () => {
  it('removes script tags and inline event handlers', () => {
    const dirty = '<p onclick="alert(1)">Hola</p><script>alert(1)</script>'
    const clean = enhancedSanitizeHTML(dirty)

    expect(clean).toContain('Hola')
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onclick')
  })

  it('blocks javascript urls', () => {
    const dirty = '<a href="javascript:alert(1)">Link</a>'
    const clean = enhancedSanitizeHTML(dirty)

    expect(clean).toContain('Link')
    expect(clean).not.toContain('javascript:')
  })

  it('marks external links and strips target blank when it cannot be preserved safely', () => {
    const dirty = '<a href="https://example.com" target="_blank">Link</a>'
    const clean = enhancedSanitizeHTML(dirty)

    expect(clean).toContain('data-external="true"')
    expect(clean).not.toContain('target="_blank"')
  })
})

describe('sanitizePlainText', () => {
  it('strips html tags from plain text', () => {
    expect(sanitizePlainText('<strong>Hola</strong> mundo')).toBe('Hola mundo')
  })
})

describe('isHTMLSafe', () => {
  it('returns true for safe plain text', () => {
    expect(isHTMLSafe('Contenido seguro')).toBe(true)
  })

  it('returns false for dangerous html', () => {
    expect(isHTMLSafe('<img src=x onerror="alert(1)" />')).toBe(false)
  })
})

describe('extractTextFromHTML', () => {
  it('extracts readable text from html fragments', () => {
    expect(extractTextFromHTML('<div><p>Hola <strong>equipo</strong></p></div>')).toBe('Hola equipo')
  })
})
