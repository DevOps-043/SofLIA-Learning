import type { ChangeEvent, MutableRefObject, ReactNode } from 'react'

export type CompanyImageType = 'logo' | 'banner' | 'favicon'

export interface BrandingColorField<T extends string> {
  key: T
  label: string
}

export interface CompanyBrandingUploadCardProps {
  label: string
  emptyLabel: string
  emptyHint: string
  actionLabel: string
  imageUrl: string
  uploading: boolean
  inputRef: MutableRefObject<HTMLInputElement | null>
  icon: ReactNode
  onFileChange: (event: ChangeEvent<HTMLInputElement>, imageType: CompanyImageType) => void
  onRemove: () => void
  imageType: CompanyImageType
  objectFit?: 'contain' | 'cover'
}
