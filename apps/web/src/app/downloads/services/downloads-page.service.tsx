import React from 'react'
import { DOWNLOADS_CHANGELOG_SECTION_META } from '../constants'
import type {
  DownloadAsset,
  GithubReleaseAssetPayload,
  GithubReleasePayload,
  ParsedReleaseNotes,
  ParsedReleaseNotesSection,
  ReleaseChangelog,
  ReleaseData,
} from '../types'

type DownloadsSectionKey = keyof typeof DOWNLOADS_CHANGELOG_SECTION_META

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isGithubReleaseAssetPayload(
  value: unknown,
): value is GithubReleaseAssetPayload {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.size === 'number' &&
    typeof value.browser_download_url === 'string'
  )
}

function isGithubReleasePayload(value: unknown): value is GithubReleasePayload {
  return isRecord(value) && typeof value.tag_name === 'string'
}

function formatAssetSize(sizeInBytes: number): string {
  return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`
}

function createDownloadAsset(asset: GithubReleaseAssetPayload): DownloadAsset {
  return {
    url: asset.browser_download_url,
    size: formatAssetSize(asset.size),
    name: asset.name,
  }
}

function formatReleaseDate(dateValue?: string): string {
  const rawDate = dateValue ? new Date(dateValue) : new Date()

  return rawDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function normalizeGithubReleasesPayload(
  payload: unknown,
): GithubReleasePayload[] {
  if (Array.isArray(payload)) {
    return payload.filter(isGithubReleasePayload).map((release) => ({
      ...release,
      assets: Array.isArray(release.assets)
        ? release.assets.filter(isGithubReleaseAssetPayload)
        : [],
    }))
  }

  if (isGithubReleasePayload(payload)) {
    return [
      {
        ...payload,
        assets: Array.isArray(payload.assets)
          ? payload.assets.filter(isGithubReleaseAssetPayload)
          : [],
      },
    ]
  }

  return []
}

export function mapLatestRelease(release: GithubReleasePayload): ReleaseData {
  const assets: ReleaseData['assets'] = {}

  for (const asset of release.assets ?? []) {
    if (asset.name.includes('Windows') && asset.name.endsWith('.exe')) {
      assets.windows = createDownloadAsset(asset)
    }

    if (asset.name.includes('Mac') && asset.name.endsWith('.dmg')) {
      assets.mac = createDownloadAsset(asset)
    }
  }

  return {
    version: release.tag_name,
    notes: release.body || '',
    date: formatReleaseDate(release.published_at || release.created_at),
    assets,
  }
}

export function mapReleaseChangelogs(
  releases: GithubReleasePayload[],
): ReleaseChangelog[] {
  return releases.map((release) => ({
    version: release.tag_name,
    notes: release.body || '',
    date: formatReleaseDate(release.published_at || release.created_at),
  }))
}

export function getDownloadsErrorMessage(error: unknown, t?: (key: string) => string): string {
  if (error instanceof Error) {
    if (error.message === 'rate_limit') {
      return t
        ? t('downloadsPage.hero.errorRateLimit')
        : 'Se excedio el limite de peticiones a GitHub. Intenta de nuevo en unos minutos.'
    }

    if (error.message === 'not_found') {
      return t ? t('downloadsPage.hero.errorNotFound') : 'No se encontraron releases disponibles.'
    }
  }

  return t
    ? t('downloadsPage.hero.errorGeneric')
    : 'No se pudo conectar con el servidor de descargas. Verifica tu conexion a internet.'
}

export function parseReleaseNotes(notes: string): ParsedReleaseNotes {
  const sections: ParsedReleaseNotesSection[] = []
  let currentSection: string | null = null
  let releaseTitle = ''

  for (const rawLine of notes.split('\n')) {
    const line = rawLine.trim()

    if (/^##\s+/.test(line) && !line.startsWith('###')) {
      releaseTitle = line.replace(/^##\s+/, '').trim()
      continue
    }

    const categoryMatch = line.match(/^###\s+(\w+)/i)
    if (categoryMatch) {
      const key = categoryMatch[1].toLowerCase()
      const metadata = (
        key in DOWNLOADS_CHANGELOG_SECTION_META
          ? DOWNLOADS_CHANGELOG_SECTION_META[key as DownloadsSectionKey]
          : DOWNLOADS_CHANGELOG_SECTION_META.fallback
      )

      sections.push({ key, label: metadata.label, items: [] })
      currentSection = key
      continue
    }

    if (/^[-*]\s+/.test(line) && currentSection) {
      const item = line.replace(/^[-*]\s+/, '').trim()
      const section = sections.find((candidate) => candidate.key === currentSection)
      if (item && section) {
        section.items.push(item)
      }
    }
  }

  if (sections.length === 0 && notes.trim()) {
    const allItems = notes
      .split('\n')
      .filter((line) => /^[-*]\s+/.test(line.trim()))
      .map((line) => line.trim().replace(/^[-*]\s+/, ''))

    if (allItems.length > 0) {
      sections.push({
        key: 'notes',
        label: DOWNLOADS_CHANGELOG_SECTION_META.notes.label,
        items: allItems,
      })
    }
  }

  for (const key of ['added', 'fixed', 'changed'] as const) {
    const metadata = DOWNLOADS_CHANGELOG_SECTION_META[key]
    if (!sections.find((section) => section.key === key)) {
      sections.push({ key, label: metadata.label, items: [] })
    }
  }

  const sectionOrder: Record<string, number> = {
    added: 0,
    fixed: 1,
    changed: 2,
    removed: 3,
    security: 4,
    notes: 5,
  }

  sections.sort(
    (left, right) =>
      (sectionOrder[left.key] ?? 999) - (sectionOrder[right.key] ?? 999),
  )

  return { releaseTitle, sections }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatMarkdownBold(text: string): string {
  return escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>',
  )
}
