'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { logger } from '@/lib/utils/logger'
import type { CompanyImageType } from '@/features/admin/components/admin-company-branding'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

type BrandingImageField = 'brand_logo_url' | 'brand_banner_url' | 'brand_favicon_url'

const BRANDING_IMAGE_FIELD: Record<CompanyImageType, BrandingImageField> = {
  logo: 'brand_logo_url',
  banner: 'brand_banner_url',
  favicon: 'brand_favicon_url',
}

interface UseBrandingImageUploadProps {
  company: CompanyData
  setCompany: (company: CompanyData) => void
}

export function useBrandingImageUpload({ company, setCompany }: UseBrandingImageUploadProps) {
  const [uploadingType, setUploadingType] = useState<CompanyImageType | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File, imageType: CompanyImageType) => {
    setUploadError(null)
    setUploadingType(imageType)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationSlug', company.slug || 'temp-org')
      formData.append('imageType', imageType)

      const response = await fetch('/api/admin/upload/organization-image', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success || !result.image?.url) {
        throw new Error(result?.error || 'Error al subir la imagen')
      }

      setCompany({ ...company, [BRANDING_IMAGE_FIELD[imageType]]: result.image.url })
    } catch (error) {
      logger.error('Error uploading branding image:', error)
      setUploadError(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setUploadingType(null)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, imageType: CompanyImageType) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void uploadImage(file, imageType)
  }

  const removeImage = (imageType: CompanyImageType) => {
    setCompany({ ...company, [BRANDING_IMAGE_FIELD[imageType]]: '' })
  }

  return {
    uploadingLogo: uploadingType === 'logo',
    uploadingBanner: uploadingType === 'banner',
    uploadingFavicon: uploadingType === 'favicon',
    uploadError,
    logoInputRef,
    bannerInputRef,
    faviconInputRef,
    handleFileChange,
    removeImage,
  }
}
