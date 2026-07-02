'use client'

import useSWR from 'swr'

import type { PublicStatusResponse } from '../types'

const REFRESH_INTERVAL_MS = 60_000

async function fetchPublicStatus(url: string): Promise<PublicStatusResponse> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('STATUS_FETCH_FAILED')
  }
  return response.json()
}

export function usePublicStatus() {
  const { data, error, isLoading } = useSWR<PublicStatusResponse>(
    '/api/status',
    fetchPublicStatus,
    { refreshInterval: REFRESH_INTERVAL_MS, revalidateOnFocus: false },
  )

  return { status: data, error, isLoading }
}
