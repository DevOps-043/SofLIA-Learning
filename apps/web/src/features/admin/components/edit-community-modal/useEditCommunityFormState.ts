'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import {
  buildCommunitySlug,
  validateAddCommunityForm,
} from '../add-community-modal'
import type { AdminCommunityFormErrors } from '../admin-communities'

export interface CommunityFormData {
  access_type: 'open' | 'moderated' | 'invite_only'
  description: string
  image_url: string
  is_active: boolean
  name: string
  slug: string
  visibility: 'public' | 'private'
}

interface UseEditCommunityFormStateProps {
  community: AdminCommunity | null
  onSave: (communityData: CommunityFormData) => Promise<void>
  onClose: () => void
}

function normalizeVisibility(value?: string): CommunityFormData['visibility'] {
  return value === 'private' ? 'private' : 'public'
}

function normalizeAccessType(value?: string): CommunityFormData['access_type'] {
  if (value === 'moderated' || value === 'invite_only') {
    return value
  }

  return 'open'
}

export function useEditCommunityFormState({ community, onSave, onClose }: UseEditCommunityFormStateProps) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    is_active: true,
    visibility: 'public',
    access_type: 'open'
  })
  const [errors, setErrors] = useState<AdminCommunityFormErrors>({})
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
        visibility: normalizeVisibility(community.visibility),
        access_type: normalizeAccessType(community.access_type)
      })
      setErrors({})
      setError(null)
    }
  }, [community])

  const setFieldValue = <K extends keyof CommunityFormData>(
    field: K,
    value: CommunityFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' ? { slug: buildCommunitySlug(String(value)) } : {}),
    }))

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = validateAddCommunityForm(formData, {
      descriptionRequired: t('communities.form.validation.descriptionRequired'),
      nameRequired: t('communities.form.validation.nameRequired'),
      slugInvalid: t('communities.form.validation.slugInvalid'),
      slugRequired: t('communities.form.validation.slugRequired'),
    })

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('communities.editModal.errorFallback'))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    errors,
    isLoading,
    error,
    setFieldValue,
    handleSubmit
  }
}
