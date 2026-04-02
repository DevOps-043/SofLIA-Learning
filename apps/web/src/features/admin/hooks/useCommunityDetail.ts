'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminCommunityDetailService } from '../services/adminCommunityDetail.service'
import type {
  AdminCommunityAccessRequest,
  AdminCommunityDetailPayload,
  AdminCommunityMember,
  AdminCommunityPost,
  AdminCommunityVideo
} from '../types/admin-community-detail.types'
import type { AdminCommunity } from '../services/adminCommunities.service'

interface CommunityDetailData {
  community: AdminCommunity | null
  posts: AdminCommunityPost[]
  members: AdminCommunityMember[]
  accessRequests: AdminCommunityAccessRequest[]
  videos: AdminCommunityVideo[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateMembers: (updatedMembers: AdminCommunityMember[]) => void
  updateAccessRequests: (updatedRequests: AdminCommunityAccessRequest[]) => void
  updatePosts: (updatedPosts: AdminCommunityPost[]) => void
}

export function useCommunityDetail(slug: string): CommunityDetailData {
  const [detail, setDetail] = useState<AdminCommunityDetailPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityData = useCallback(async () => {
    if (!slug) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload = await AdminCommunityDetailService.getCommunityDetail(slug)
      setDetail(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchCommunityData()
  }, [fetchCommunityData])

  const updateDetail = useCallback((updater: (current: AdminCommunityDetailPayload) => AdminCommunityDetailPayload) => {
    setDetail(current => (current ? updater(current) : current))
  }, [])

  return {
    community: detail?.community || null,
    posts: detail?.posts || [],
    members: detail?.members || [],
    accessRequests: detail?.accessRequests || [],
    videos: detail?.videos || [],
    isLoading,
    error,
    refetch: fetchCommunityData,
    updateMembers: updatedMembers => updateDetail(current => ({ ...current, members: updatedMembers })),
    updateAccessRequests: updatedRequests => updateDetail(current => ({ ...current, accessRequests: updatedRequests })),
    updatePosts: updatedPosts => updateDetail(current => ({ ...current, posts: updatedPosts }))
  }
}
