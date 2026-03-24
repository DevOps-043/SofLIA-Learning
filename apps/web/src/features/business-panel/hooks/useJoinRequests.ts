'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { JoinRequest, JoinRequestsService } from '../services/joinRequests.service'

interface UseJoinRequestsReturn {
  requests: JoinRequest[]
  count: number
  isLoading: boolean
  error: string | null
  refetch: () => void
  reviewRequest: (requestId: string, action: 'approve' | 'reject') => Promise<void>
  reviewingId: string | null
}

export function useJoinRequests(): UseJoinRequestsReturn {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await JoinRequestsService.getJoinRequests(orgSlug)
      setRequests(data.requests)
      setCount(data.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  const reviewRequest = useCallback(
    async (requestId: string, action: 'approve' | 'reject') => {
      try {
        setReviewingId(requestId)
        setError(null)
        await JoinRequestsService.reviewJoinRequest(orgSlug, requestId, action)
        await fetchRequests()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        throw err
      } finally {
        setReviewingId(null)
      }
    },
    [orgSlug, fetchRequests]
  )

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return {
    requests,
    count,
    isLoading,
    error,
    refetch: fetchRequests,
    reviewRequest,
    reviewingId,
  }
}
