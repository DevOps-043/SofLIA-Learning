import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import {
  createCompanySlug,
  createInitialCompanyData,
} from './service'
import type { CreateCompanyData, CreateTab } from './types'

export function useAdminCreateCompanyModal() {
  const [activeTab, setActiveTab] = useState<CreateTab>('general')
  const [formData, setFormData] = useState<CreateCompanyData>(
    createInitialCompanyData(),
  )
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (
    file: File,
    imageType: 'logo' | 'banner',
  ) => {
    const slug = formData.slug || `new-org-${Date.now()}`

    try {
      if (imageType === 'logo') {
        setUploadingLogo(true)
      } else {
        setUploadingBanner(true)
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('organizationSlug', slug)
      formDataUpload.append('imageType', imageType)

      const response = await fetch('/api/admin/upload/organization-image', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (result.success && result.image?.url) {
        setFormData((current) =>
          imageType === 'logo'
            ? {
                ...current,
                brand_logo_url: result.image.url,
                brand_favicon_url: result.image.favicon_url || result.image.url,
              }
            : {
                ...current,
                brand_banner_url: result.image.url,
              },
        )
        return
      }

      throw new Error(result.error || 'Error al subir la imagen')
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      if (imageType === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingBanner(false)
      }
    }
  }

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleImageUpload(file, imageType)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData((current) => ({
      ...current,
      name,
      slug: createCompanySlug(name),
    }))
  }

  return {
    activeTab,
    formData,
    isPlanOpen,
    uploadingLogo,
    uploadingBanner,
    imageUploadError,
    setImageUploadError,
    logoInputRef,
    bannerInputRef,
    setActiveTab,
    setFormData,
    setIsPlanOpen,
    handleFileChange,
    handleNameChange,
  }
}
