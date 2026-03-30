'use client'

import { useState, useEffect } from 'react'
import { InstructorCommunity } from '../services/instructorCommunities.service'

interface InstructorCommunityDetailData {
  community: InstructorCommunity | null
  posts: any[]
  members: any[]
  accessRequests: any[]
  videos: any[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  updateMembers: (updatedMembers: any[]) => void
  updateAccessRequests: (updatedRequests: any[]) => void
  updatePosts: (updatedPosts: any[]) => void
}

export function useInstructorCommunityDetail(slug: string): InstructorCommunityDetailData {
  const [community, setCommunity] = useState<InstructorCommunity | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
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

  // Función para actualizar solo los miembros
  const updateMembers = (updatedMembers: any[]) => {
    setMembers(updatedMembers)
  }

  // Función para actualizar solo las solicitudes de acceso
  const updateAccessRequests = (updatedRequests: any[]) => {
    setAccessRequests(updatedRequests)
  }

  // Función para actualizar solo los posts
  const updatePosts = (updatedPosts: any[]) => {
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

