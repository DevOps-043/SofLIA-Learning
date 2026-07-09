import type { CompanyImageType } from '../admin-company-branding'
import { useRef, useState, type ChangeEvent } from 'react'

interface UseAdminCreateCompanyUploadProps {
  slug: string
  onLogoUploaded: (logoUrl: string, faviconUrl: string) => void
  onBannerUploaded: (bannerUrl: string) => void
}

export function useAdminCreateCompanyUpload({
  slug,
  onLogoUploaded,
  onBannerUploaded,
}: UseAdminCreateCompanyUploadProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageType: CompanyImageType,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      void handleImageUpload(file, imageType)
    }
  }

  const handleImageUpload = async (
    file: File,
    imageType: CompanyImageType,
  ) => {
    try {
      toggleUploadingState(imageType, true, setUploadingLogo, setUploadingBanner)
      const result = await uploadCompanyImage(file, slug, imageType)

      if (imageType === 'logo') {
        onLogoUploaded(result.image.url, result.image.favicon_url || result.image.url)
      } else {
        onBannerUploaded(result.image.url)
      }
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      toggleUploadingState(imageType, false, setUploadingLogo, setUploadingBanner)
    }
  }

  return {
    uploadingLogo,
    uploadingBanner,
    imageUploadError,
    setImageUploadError,
    logoInputRef,
    bannerInputRef,
    handleFileChange,
  }
}

function toggleUploadingState(
  imageType: CompanyImageType,
  value: boolean,
  setUploadingLogo: (value: boolean) => void,
  setUploadingBanner: (value: boolean) => void,
) {
  if (imageType === 'logo') {
    setUploadingLogo(value)
    return
  }
  setUploadingBanner(value)
}

async function uploadCompanyImage(
  file: File,
  slug: string,
  imageType: CompanyImageType,
) {
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
    return result
  }

  throw new Error(result.error || 'Error al subir la imagen')
}
