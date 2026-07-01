'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
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
  const { branding, isLoading, error, updateBranding, detectColors } = useBranding()
  const { refetch: refetchStyles, syncStyles } = useOrganizationStylesContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>(
    { isOpen: false, message: '', type: 'success' }
  )
  const showToast = useCallback((message: string, type: ToastType = 'success') =>
    setToast({ isOpen: true, message, type }), [])
  const hideToast = useCallback(() =>
    setToast(prev => ({ ...prev, isOpen: false })), [])
  const [localBranding, setLocalBranding] = useState<BrandingFormState>(
    createBrandingFormState(),
  )
  const isInitialLoad = useRef(true)
  const previousBannerUrl = useRef('')

  useEffect(() => {
    if (!branding) return

    setLocalBranding(createBrandingFormState(branding))
    previousBannerUrl.current = branding.banner_url || ''
    isInitialLoad.current = false
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

      try {
        const colors = await detectColors(localBranding.banner_url)

        if (hasDetectedBrandingPalette(colors)) {
          setLocalBranding((current) => ({
            ...current,
            ...colors,
          }))
          showToast('Colores detectados automáticamente', 'success')
        }
      } catch (err) {
        techDebtLogger.error('Error detectando colores automáticamente:', err)
      } finally {
        setIsDetecting(false)
      }
    }

    const timeoutId = window.setTimeout(() => {
      void autoDetectColors()
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [detectColors, localBranding.banner_url])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const result = await updateBranding(localBranding)

      if (!result.success) {
        throw new Error('Error al actualizar el branding')
      }

      showToast('Branding actualizado correctamente', 'success')
      if (result.styles) {
        syncStyles(result.styles)
      } else {
        await refetchStyles()
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al actualizar el branding',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectColors = async () => {
    if (!localBranding.banner_url) {
      showToast('Primero debes subir un banner', 'error')
      return
    }

    setIsDetecting(true)

    try {
      const colors = await detectColors(localBranding.banner_url)

      if (!hasDetectedBrandingPalette(colors)) {
        throw new Error(
          'No se pudieron detectar colores del banner. Asegúrate de que la imagen sea accesible.',
        )
      }

      setLocalBranding((current) => ({
        ...current,
        ...colors,
      }))
      showToast('Colores detectados automáticamente', 'success')
    } catch (err) {
      techDebtLogger.error('Error detectando colores:', err)
      showToast(
        err instanceof Error ? err.message : 'Error al detectar colores',
        'error',
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
      showToast('Error al subir la imagen', 'error')
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

  const handleToggleBranding = (enabled: boolean) => {
    setLocalBranding((current) => ({
      ...current,
      branding_enabled: enabled,
    }))
  }

  return {
    isLoading,
    error,
    isSaving,
    isDetecting,
    toast,
    hideToast,
    localBranding,
    setLocalBranding,
    handleSave,
    handleDetectColors,
    handleToggleBranding,
    openFileDialog,
    handleDropUpload,
  }
}
