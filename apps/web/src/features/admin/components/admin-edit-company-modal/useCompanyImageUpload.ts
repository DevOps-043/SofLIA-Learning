import { useRef, useState, type ChangeEvent } from 'react'

interface UseCompanyImageUploadProps {
  slug: string
  onLogoUploaded: (logoUrl: string, faviconUrl: string) => void
  onBannerUploaded: (bannerUrl: string) => void
}

export function useCompanyImageUpload({
  slug,
  onLogoUploaded,
  onBannerUploaded,
}: UseCompanyImageUploadProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      void uploadCompanyImage(file, imageType)
    }
  }

  const uploadCompanyImage = async (
    file: File,
    imageType: 'logo' | 'banner',
  ) => {
    try {
      setUploadingState(imageType, true, setUploadingLogo, setUploadingBanner)
      const result = await postCompanyImage(file, slug, imageType)

      if (imageType === 'logo') {
        onLogoUploaded(result.image.url, result.image.favicon_url || result.image.url)
      } else {
        onBannerUploaded(result.image.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setImageUploadError('Error al subir la imagen')
    } finally {
      setUploadingState(imageType, false, setUploadingLogo, setUploadingBanner)
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

function setUploadingState(
  imageType: 'logo' | 'banner',
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

async function postCompanyImage(
  file: File,
  slug: string,
  imageType: 'logo' | 'banner',
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

  console.error('Upload failed:', result.error)
  throw new Error(result.error || 'Error al subir la imagen')
}
