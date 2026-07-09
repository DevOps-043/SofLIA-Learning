'use client'

import type { CompanyImageType } from '../admin-company-branding'
import type { ChangeEvent, MutableRefObject } from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { AdminCompanyBrandingUploadCard } from '../admin-company-branding'

interface AdminCreateCompanyBannerUploadProps {
  imageUrl: string
  inputRef: MutableRefObject<HTMLInputElement | null>
  uploading: boolean
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    imageType: CompanyImageType,
  ) => void
  onRemove: () => void
}

export function AdminCreateCompanyBannerUpload(props: AdminCreateCompanyBannerUploadProps) {
  return (
    <AdminCompanyBrandingUploadCard
      label="Banner de Marca"
      emptyLabel="Subir banner"
      emptyHint="PNG, JPG (max. 10MB)"
      actionLabel="Cambiar banner"
      imageType="banner"
      imageUrl={props.imageUrl}
      inputRef={props.inputRef}
      uploading={props.uploading}
      onFileChange={props.onFileChange}
      onRemove={props.onRemove}
      objectFit="cover"
      icon={<GlobeAltIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
    />
  )
}
