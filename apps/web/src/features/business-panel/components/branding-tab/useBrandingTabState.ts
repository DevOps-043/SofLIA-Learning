'use client'

import { useEffect, useRef, useState } from 'react'
import { useBranding } from '../../hooks/useBranding'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import {
  createBrandingFormState,
  hasDetectedBrandingPalette,
  shouldAutoDetectBrandingColors,
} from './service'
import type { BrandingFormState } from './types'

async function uploadBrandingImage(file: File, folder: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'Panel-Business')
  formData.append('folder', folder)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  const result = await response.json()

  if (!result.success || !result.url) {
    throw new Error('Error al subir la imagen')
  }

  return result.url as string
}

export function useBrandingTabState() {
  const { branding, isLoading, error, updateBranding, detectColors } =
    useBranding()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localBranding, setLocalBranding] = useState<BrandingFormState>(
    createBrandingFormState(),
  )
  const isInitialLoad = useRef(true)
  const previousBannerUrl = useRef('')

  useEffect(() => {
    if (branding) {
      setLocalBranding(createBrandingFormState(branding))
      previousBannerUrl.current = branding.banner_url || ''
      isInitialLoad.current = false
    }
  }, [branding])

  useEffect(() => {
    if (
      !shouldAutoDetectBrandingColors({
        isInitialLoad: isInitialLoad.current,
        bannerUrl: localBranding.banner_url,
        previousBannerUrl: previousBannerUrl.current,
      })
    ) {
      return
    }

    previousBannerUrl.current = localBranding.banner_url

    const autoDetectColors = async () => {
      setIsDetecting(true)
      setSaveError(null)
      setSaveSuccess(null)

      try {
        const colors = await detectColors(localBranding.banner_url)

        if (hasDetectedBrandingPalette(colors)) {
          setLocalBranding((current) => ({
            ...current,
            ...colors,
          }))
          setSaveSuccess('Colores detectados automÃ¡ticamente')
          setTimeout(() => setSaveSuccess(null), 5000)
        }
      } catch (err) {
        console.error('Error detectando colores automÃ¡ticamente:', err)
      } finally {
        setIsDetecting(false)
      }
    }

    const timeoutId = window.setTimeout(() => {
      void autoDetectColors()
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [detectColors, localBranding.banner_url])

  const setTemporaryError = (message: string) => {
    setSaveError(message)
    setTimeout(() => setSaveError(null), 5000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateBranding(localBranding)

      if (!success) {
        throw new Error('Error al actualizar el branding')
      }

      setSaveSuccess('Branding actualizado correctamente')
      setTimeout(() => setSaveSuccess(null), 5000)
      await refetchStyles()
    } catch (err) {
      setTemporaryError(
        err instanceof Error ? err.message : 'Error al actualizar el branding',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectColors = async () => {
    if (!localBranding.banner_url) {
      setTemporaryError('Primero debes subir un banner')
      return
    }

    setIsDetecting(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const colors = await detectColors(localBranding.banner_url)

      if (!hasDetectedBrandingPalette(colors)) {
        throw new Error(
          'No se pudieron detectar colores del banner. AsegÃºrate de que la imagen sea accesible.',
        )
      }

      setLocalBranding((current) => ({
        ...current,
        ...colors,
      }))
      setSaveSuccess('Colores detectados automÃ¡ticamente')
      setTimeout(() => setSaveSuccess(null), 5000)
    } catch (err) {
      console.error('Error detectando colores:', err)
      setTemporaryError(
        err instanceof Error ? err.message : 'Error al detectar colores',
      )
    } finally {
      setIsDetecting(false)
    }
  }

  const uploadToField = async (
    file: File,
    folder: string,
    field: keyof Pick<BrandingFormState, 'banner_url' | 'favicon_url'>,
  ) => {
    try {
      const url = await uploadBrandingImage(file, folder)
      setLocalBranding((current) => ({
        ...current,
        [field]: url,
      }))
    } catch {
      setTemporaryError('Error al subir la imagen')
    }
  }

  const openFileDialog = (
    folder: string,
    field: keyof Pick<BrandingFormState, 'banner_url' | 'favicon_url'>,
  ) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        void uploadToField(file, folder, field)
      }
    }
    input.click()
  }

  const handleDropUpload = async (
    file: File,
    folder: string,
    field: keyof Pick<BrandingFormState, 'banner_url' | 'favicon_url'>,
  ) => {
    if (file.type.startsWith('image/')) {
      await uploadToField(file, folder, field)
    }
  }

  return {
    isLoading,
    error,
    isSaving,
    isDetecting,
    saveSuccess,
    saveError,
    localBranding,
    setLocalBranding,
    handleSave,
    handleDetectColors,
    openFileDialog,
    handleDropUpload,
  }
}
