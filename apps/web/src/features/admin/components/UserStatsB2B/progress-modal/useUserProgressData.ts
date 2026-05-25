'use client'

import useSWR from 'swr'
import type { UserProgressResponse } from '../types'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Error ${response.status}`)
  return response.json()
}

export function useUserProgressData(userId: string, isOpen: boolean) {
  return useSWR<UserProgressResponse>(
    isOpen ? `/api/admin/user-stats/users/${userId}/progress` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )
}
