'use client'

import { useState, useEffect } from 'react'
import type { AdminCommunity } from '../../services/adminCommunities.service'

export interface CommunityFormData {
  access_type: string
  description: string
  image_url: string
  is_active: boolean
  name: string
  slug: string
  visibility: string
}

interface UseEditCommunityFormStateProps {
  community: AdminCommunity | null
  onSave: (communityData: CommunityFormData) => Promise<void>
  onClose: () => void
}

export function useEditCommunityFormState({ community, onSave, onClose }: UseEditCommunityFormStateProps) {
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    is_active: true,
    visibility: 'public',
    access_type: 'open'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || '',
        description: community.description || '',
        slug: community.slug || '',
        image_url: community.image_url || '',
        is_active: community.is_active,
        visibility: community.visibility || 'public',
        access_type: community.access_type || 'open'
      })
    }
  }, [community])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar comunidad')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    isLoading,
    error,
    handleChange,
    handleSubmit
  }
}
