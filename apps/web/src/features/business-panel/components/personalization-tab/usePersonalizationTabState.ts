'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { PersonalizationTabProps } from './personalization.types'
import { normalizeSlugInput, validateOrganizationSlug } from './slug-validation'

export function usePersonalizationTabState({
  organization,
  setSaveError,
  setSaveSuccess,
  updateOrganization,
}: PersonalizationTabProps) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const [slug, setSlug] = useState(organization?.slug || '')
  const [baseUrl, setBaseUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [isUpdatingGoogle, setIsUpdatingGoogle] = useState(false)
  const [isUpdatingMicrosoft, setIsUpdatingMicrosoft] = useState(false)

  useEffect(() => setBaseUrl(window.location.origin), [])
  useEffect(() => {
    if (organization?.slug) setSlug(organization.slug)
  }, [organization?.slug])

  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (!slug || slug === organization?.slug) {
        setSlugAvailable(null)
        return
      }
      const validationError = validateOrganizationSlug(slug)
      if (validationError) {
        setSlugError(validationError)
        setSlugAvailable(null)
        return
      }
      setIsCheckingSlug(true)
      setSlugError(null)
      try {
        const fetchUrl = orgSlug
          ? `/api/${orgSlug}/business/settings/check-slug?slug=${encodeURIComponent(slug)}`
          : `/api/business/settings/check-slug?slug=${encodeURIComponent(slug)}`
        const response = await fetch(fetchUrl, { credentials: 'include' })
        const data = await response.json()
        if (data.success) {
          setSlugAvailable(data.available)
          if (!data.available) setSlugError('Este identificador ya esta en uso')
        }
      } finally {
        setIsCheckingSlug(false)
      }
    }
    const debounceTimeout = setTimeout(checkSlugAvailability, 500)
    return () => clearTimeout(debounceTimeout)
  }, [orgSlug, organization?.slug, slug])

  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeSlugInput(event.target.value)
    setSlug(value)
    setSlugAvailable(null)
    setSlugError(validateOrganizationSlug(value))
  }
  const handleSaveSlug = async () => {
    if (!slug || slugError || !slugAvailable) return
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    const success = await updateOrganization({ slug })
    setIsSaving(false)
    if (success) {
      setSaveSuccess('Identificador de login guardado correctamente')
      setTimeout(() => setSaveSuccess(null), 5000)
      setSlugAvailable(null)
    } else {
      setSaveError('Error al guardar el identificador')
      setTimeout(() => setSaveError(null), 5000)
    }
  }
  const handleToggleSSO = async (provider: 'google' | 'microsoft', value: boolean) => {
    provider === 'google' ? setIsUpdatingGoogle(true) : setIsUpdatingMicrosoft(true)
    try {
      await updateOrganization({ [`${provider}_login_enabled`]: value })
    } finally {
      provider === 'google' ? setIsUpdatingGoogle(false) : setIsUpdatingMicrosoft(false)
    }
  }
  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    navigator.clipboard?.writeText(text).then(() => {
      if (type === 'login') {
        setCopiedLogin(true)
        setTimeout(() => setCopiedLogin(false), 2000)
      } else {
        setCopiedRegister(true)
        setTimeout(() => setCopiedRegister(false), 2000)
      }
    })
  }

  return {
    baseUrl,
    copiedLogin,
    copiedRegister,
    copyToClipboard,
    handleSaveSlug,
    handleSlugChange,
    handleToggleSSO,
    isCheckingSlug,
    isSaving,
    isUpdatingGoogle,
    isUpdatingMicrosoft,
    loginUrl: slug ? `${baseUrl}/auth/${slug}` : '',
    registerUrl: slug ? `${baseUrl}/auth/${slug}/register` : '',
    slug,
    slugAvailable,
    slugError,
  }
}
