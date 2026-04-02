'use client'

import { useCallback, useEffect, useState } from 'react'
import { InstructorCommunityDetailService } from '../services/instructorCommunityDetail.service'
import type {
  CommunityAccessRequest,
  CommunityMember,
  CommunityPost,
  CommunityVideo,
  InstructorCommunityDetailPayload
} from '../types/instructor-community-detail.types'
import type { InstructorCommunity } from '../services/instructorCommunities.service'

interface InstructorCommunityDetailData {
  community: InstructorCommunity | null
  posts: CommunityPost[]
  members: CommunityMember[]
  accessRequests: CommunityAccessRequest[]
  videos: CommunityVideo[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateMembers: (updatedMembers: CommunityMember[]) => void
  updateAccessRequests: (updatedRequests: CommunityAccessRequest[]) => void
  updatePosts: (updatedPosts: CommunityPost[]) => void
  updateVideos: (updatedVideos: CommunityVideo[]) => void
}

export type {
  CommunityAccessRequest,
  CommunityMember,
  CommunityPost,
  CommunityVideo
} from '../types/instructor-community-detail.types'

export function useInstructorCommunityDetail(slug: string): InstructorCommunityDetailData {
  const [detail, setDetail] = useState<InstructorCommunityDetailPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityData = useCallback(async () => {
    if (!slug) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload = await InstructorCommunityDetailService.getCommunityDetail(slug)
      setDetail(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchCommunityData()
  }, [fetchCommunityData])

  const updateDetail = useCallback((updater: (current: InstructorCommunityDetailPayload) => InstructorCommunityDetailPayload) => {
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
    updatePosts: updatedPosts => updateDetail(current => ({ ...current, posts: updatedPosts })),
    updateVideos: updatedVideos => updateDetail(current => ({ ...current, videos: updatedVideos }))
  }
}
