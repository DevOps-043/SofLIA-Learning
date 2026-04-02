import React from 'react'
import { describe, expect, it } from 'vitest'
import {
  formatMarkdownBold,
  getDownloadsErrorMessage,
  mapLatestRelease,
  normalizeGithubReleasesPayload,
  parseReleaseNotes,
} from '../services/downloads-page.service'

describe('downloads-page.service', () => {
  it('normalizes a single github release payload', () => {
    const releases = normalizeGithubReleasesPayload({
      tag_name: 'v1.0.0',
      assets: [],
    })

    expect(releases).toHaveLength(1)
    expect(releases[0]?.tag_name).toBe('v1.0.0')
  })

  it('maps the latest release assets by platform', () => {
    const release = mapLatestRelease({
      tag_name: 'v2.3.0',
      published_at: '2026-04-01T00:00:00.000Z',
      assets: [
        {
          name: 'SofLIA Hub Windows.exe',
          size: 5 * 1024 * 1024,
          browser_download_url: 'https://example.com/windows.exe',
        },
        {
          name: 'SofLIA Hub Mac.dmg',
          size: 6 * 1024 * 1024,
          browser_download_url: 'https://example.com/mac.dmg',
        },
      ],
    })

    expect(release.assets.windows?.url).toContain('windows.exe')
    expect(release.assets.mac?.url).toContain('mac.dmg')
    expect(release.assets.windows?.size).toBe('5.0 MB')
  })

  it('parses release notes into ordered sections', () => {
    const parsed = parseReleaseNotes(`
## v1.2.0
### Added
- Nuevo modulo
### Fixed
- Error de login
`)

    expect(parsed.releaseTitle).toBe('v1.2.0')
    expect(parsed.sections[0]?.key).toBe('added')
    expect(parsed.sections[0]?.items).toContain('Nuevo modulo')
    expect(parsed.sections[1]?.key).toBe('fixed')
  })

  it('falls back to generic notes when markdown categories do not exist', () => {
    const parsed = parseReleaseNotes(`
- Cambio uno
- Cambio dos
`)

    expect(parsed.sections.find((section) => section.key === 'notes')?.items).toEqual([
      'Cambio uno',
      'Cambio dos',
    ])
  })

  it('formats bold markdown into strong nodes', () => {
    const formatted = formatMarkdownBold('Hola **equipo**')

    expect(formatted).toContain('<strong')
    expect(formatted).toContain('equipo')
  })

  it('maps release errors to safe user messages', () => {
    expect(getDownloadsErrorMessage(new Error('rate_limit'))).toContain(
      'limite de peticiones',
    )
    expect(getDownloadsErrorMessage(new Error('not_found'))).toContain(
      'No se encontraron releases',
    )
  })
})
