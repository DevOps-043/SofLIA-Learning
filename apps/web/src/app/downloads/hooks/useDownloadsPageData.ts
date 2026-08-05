'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RELEASES_API } from '../constants'
import {
  getDownloadsErrorMessage,
  mapLatestRelease,
  mapReleaseChangelogs,
  normalizeGithubReleasesPayload,
} from '../services/downloads-page.service'
import type { ReleaseChangelog, ReleaseData } from '../types'

export function useDownloadsPageData() {
  const { t } = useTranslation('common')
  const [release, setRelease] = useState<ReleaseData | null>(null)
  const [changelogs, setChangelogs] = useState<ReleaseChangelog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})

  const toggleSection = useCallback((version: string, key: string) => {
    const sectionKey = `${version}-${key}`

    setExpandedSections((previousState) => ({
      ...previousState,
      [sectionKey]: !previousState[sectionKey],
    }))
  }, [])

  const toggleVersion = useCallback((version: string) => {
    setExpandedVersions((previousState) => ({
      ...previousState,
      [version]: !previousState[version],
    }))
  }, [])

  const fetchRelease = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      // El CDN ya acota las llamadas a GitHub; la caché del navegador solo
      // añadiría una ventana más de retraso sobre la que no tenemos control. La
      // respuesta llega al cliente como `Cache-Control: public` sin `max-age`
      // (el CDN se queda las directivas de caché compartida), es decir, sin
      // tiempo de frescura explícito: sin `no-store`, el navegador —o cualquier
      // proxy intermedio— decide por heurística cuánto reutilizar la versión
      // antigua, y una release recién publicada puede no aparecer nunca.
      const response = await fetch(RELEASES_API, { cache: 'no-store', signal })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('rate_limit')
        }

        if (response.status === 404) {
          throw new Error('not_found')
        }

        throw new Error(`HTTP ${response.status}`)
      }

      const releases = normalizeGithubReleasesPayload(await response.json())
      if (releases.length === 0) {
        throw new Error('invalid_response')
      }

      setRelease(mapLatestRelease(releases[0]))
      setChangelogs(mapReleaseChangelogs(releases))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setError(getDownloadsErrorMessage(error, t))
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    fetchRelease(abortController.signal)

    return () => abortController.abort()
  }, [fetchRelease])

  return {
    release,
    changelogs,
    loading,
    error,
    expandedSections,
    expandedVersions,
    toggleSection,
    toggleVersion,
    refetchRelease: () => fetchRelease(),
  }
}
