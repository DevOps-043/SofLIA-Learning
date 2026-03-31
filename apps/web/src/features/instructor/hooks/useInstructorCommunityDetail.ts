'use client'

import { useState, useEffect } from 'react'
import { InstructorCommunity } from '../services/instructorCommunities.service'

export interface CommunityPost {
  id: string
  content: string
  author_id: string
  created_at: string
  [key: string]: unknown
}

export interface CommunityMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  [key: string]: unknown
}

export interface CommunityAccessRequest {
  id: string
  user_id: string
  status: string
  created_at: string
  [key: string]: unknown
}

export interface CommunityVideo {
  id: string
  title: string
  url: string
  created_at: string
  [key: string]: unknown
}

interface InstructorCommunityDetailData {
  community: InstructorCommunity | null
  posts: CommunityPost[]
  members: CommunityMember[]
  accessRequests: CommunityAccessRequest[]
  videos: CommunityVideo[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  updateMembers: (updatedMembers: CommunityMember[]) => void
  updateAccessRequests: (updatedRequests: CommunityAccessRequest[]) => void
  updatePosts: (updatedPosts: CommunityPost[]) => void
}

export function useInstructorCommunityDetail(slug: string): InstructorCommunityDetailData {
  const [community, setCommunity] = useState<InstructorCommunity | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [accessRequests, setAccessRequests] = useState<CommunityAccessRequest[]>([])
  const [videos, setVideos] = useState<CommunityVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityData = async () => {
    if (!slug) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch community basic info
      const communityResponse = await fetch(`/api/instructor/communities/slug/${slug}`)
      const communityData = await communityResponse.json()

      if (!communityData.success) {
        throw new Error(communityData.message || 'Error al obtener la comunidad')
      }

      setCommunity(communityData.community)

      // Fetch related data if community exists
      if (communityData.community) {
        const communityId = communityData.community.id

        // Fetch posts
        const postsResponse = await fetch(`/api/admin/communities/${communityId}/posts`)
        const postsData = await postsResponse.json()
        if (postsData.success) {
          setPosts(postsData.posts)
        }

        // Fetch members
        const membersResponse = await fetch(`/api/admin/communities/${communityId}/members`)
        const membersData = await membersResponse.json()
        if (membersData.success) {
          setMembers(membersData.members)
        }

        // Fetch access requests
        const requestsResponse = await fetch(`/api/admin/communities/${communityId}/access-requests`)
        const requestsData = await requestsResponse.json()
        if (requestsData.success) {
          setAccessRequests(requestsData.requests)
        }

        // Fetch videos
        const videosResponse = await fetch(`/api/admin/communities/${communityId}/videos`)
        const videosData = await videosResponse.json()
        if (videosData.success) {
          setVideos(videosData.videos)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunityData()
  }, [slug])

  const refetch = () => {
    fetchCommunityData()
  }

  const updateMembers = (updatedMembers: CommunityMember[]) => {
    setMembers(updatedMembers)
  }

  const updateAccessRequests = (updatedRequests: CommunityAccessRequest[]) => {
    setAccessRequests(updatedRequests)
  }

  const updatePosts = (updatedPosts: CommunityPost[]) => {
    setPosts(updatedPosts)
  }

  return {
    community,
    posts,
    members,
    accessRequests,
    videos,
    isLoading,
    error,
    refetch,
    updateMembers,
    updateAccessRequests,
    updatePosts
  }
}

