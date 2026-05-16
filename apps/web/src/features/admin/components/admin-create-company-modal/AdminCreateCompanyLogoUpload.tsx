'use client'

import type { ChangeEvent, MutableRefObject } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { AdminCompanyBrandingUploadCard } from '../admin-company-branding'

interface AdminCreateCompanyLogoUploadProps {
  imageUrl: string
  inputRef: MutableRefObject<HTMLInputElement | null>
  uploading: boolean
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => void
  onRemove: () => void
}

export function AdminCreateCompanyLogoUpload(props: AdminCreateCompanyLogoUploadProps) {
  return (
    <AdminCompanyBrandingUploadCard
      label="Logo de la Empresa"
      emptyLabel="Subir logo"
      emptyHint="PNG, JPG, SVG (max. 5MB)"
      actionLabel="Cambiar logo"
      imageType="logo"
      imageUrl={props.imageUrl}
      inputRef={props.inputRef}
      uploading={props.uploading}
      onFileChange={props.onFileChange}
      onRemove={props.onRemove}
      icon={<PhotoIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
    />
  )
}
