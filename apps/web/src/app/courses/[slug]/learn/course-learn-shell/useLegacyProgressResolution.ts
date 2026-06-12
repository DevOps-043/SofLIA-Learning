'use client'

import { useCallback, useEffect, useState } from 'react'

type LegacyProgressCandidate = {
  enrollmentId: string | null
  hasEnrollment: boolean
  organizationId: string
  organizationName: string
  organizationSlug: string
  progressPercentage: number
}

type LegacyProgressResolution = {
  candidates: LegacyProgressCandidate[]
  legacy: {
    activitySubmissionsCount: number
    hasLegacyData: boolean
    notesCount: number
    progressPercentage: number
    progressRowsCount: number
    quizSubmissionsCount: number
    trackingRowsCount: number
  }
  requiresSelection: boolean
}

type ClaimResult = {
  redirectPath: string
}

export type LegacyProgressResolutionState = {
  claimingOrganizationId: string | null
  error: string | null
  isClaiming: boolean
  isLoading: boolean
  resolution: LegacyProgressResolution | null
  selectOrganization: (organizationId: string) => Promise<string | null>
}

export function useLegacyProgressResolution({
  enabled,
  slug,
}: {
  enabled: boolean
  slug: string
}): LegacyProgressResolutionState {
  const [resolution, setResolution] = useState<LegacyProgressResolution | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimingOrganizationId, setClaimingOrganizationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !slug) {
      setResolution(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const abortController = new AbortController()

    async function loadResolution() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/courses/${encodeURIComponent(slug)}/legacy-progress-resolution`,
          {
            credentials: 'include',
            signal: abortController.signal,
          },
        )

        if (!response.ok) {
          throw new Error('LEGACY_PROGRESS_RESOLUTION_FAILED')
        }

        const payload = (await response.json()) as LegacyProgressResolution

        if (!abortController.signal.aborted) {
          setResolution(payload)
        }
      } catch (loadError) {
        if (
          abortController.signal.aborted ||
          (loadError instanceof DOMException && loadError.name === 'AbortError')
        ) {
          return
        }

        setError('LEGACY_PROGRESS_RESOLUTION_FAILED')
        setResolution(null)
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadResolution()

    return () => {
      abortController.abort()
    }
  }, [enabled, slug])

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      if (!slug || isClaiming) {
        return null
      }

      try {
        setIsClaiming(true)
        setClaimingOrganizationId(organizationId)
        setError(null)

        const response = await fetch(
          `/api/courses/${encodeURIComponent(slug)}/legacy-progress-resolution`,
          {
            body: JSON.stringify({ organizationId }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          },
        )

        if (!response.ok) {
          throw new Error('LEGACY_PROGRESS_CLAIM_FAILED')
        }

        const payload = (await response.json()) as ClaimResult
        return payload.redirectPath
      } catch {
        setError('LEGACY_PROGRESS_CLAIM_FAILED')
        return null
      } finally {
        setIsClaiming(false)
        setClaimingOrganizationId(null)
      }
    },
    [isClaiming, slug],
  )

  return {
    claimingOrganizationId,
    error,
    isClaiming,
    isLoading,
    resolution,
    selectOrganization,
  }
}
