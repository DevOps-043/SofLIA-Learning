'use client'

import useSWR from 'swr'
import type { OnboardingStatusResponse } from '../types'

const fetcher = async (url: string): Promise<OnboardingStatusResponse> => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error fetching onboarding status')
  return res.json()
}

export function useOnboardingStatus() {
  const { data, error, isLoading, mutate } = useSWR<OnboardingStatusResponse>(
    '/api/organizations/my-status',
    fetcher,
    {
      refreshInterval: (latestData) => {
        // Poll every 30s when pending, otherwise don't auto-refresh
        const status = latestData?.status
        if (status === 'pending_company' || status === 'pending_join') return 30000
        return 0
      },
      revalidateOnFocus: true,
    }
  )

  return {
    status: data?.status ?? 'none',
    type: data?.type,
    organizationSlug: data?.organizationSlug,
    organizationName: data?.organizationName,
    isLoading,
    error,
    refetch: mutate,
  }
}
