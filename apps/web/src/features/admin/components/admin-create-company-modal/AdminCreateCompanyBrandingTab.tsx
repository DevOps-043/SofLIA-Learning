'use client'

import type { CompanyImageType } from '../admin-company-branding'
import type { ChangeEvent, MutableRefObject } from 'react'
import {
  AdminCompanyBrandingColorPalette,
  AdminCompanyBrandingPanel,
} from '../admin-company-branding'
import { AdminCreateCompanyBannerUpload } from './AdminCreateCompanyBannerUpload'
import { AdminCreateCompanyLogoUpload } from './AdminCreateCompanyLogoUpload'
import { updateCompanyColor } from './service'
import type { CreateCompanyData } from './types'

type CreateCompanyColorKey =
  | 'brand_color_primary'
  | 'brand_color_secondary'
  | 'brand_color_accent'

interface AdminCreateCompanyBrandingTabProps {
  formData: CreateCompanyData
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    imageType: CompanyImageType,
  ) => void
}

const colorFields = [
  { key: 'brand_color_primary', label: 'Primario' },
  { key: 'brand_color_secondary', label: 'Secundario' },
  { key: 'brand_color_accent', label: 'Acento' },
] as const satisfies readonly { key: CreateCompanyColorKey; label: string }[]

export function AdminCreateCompanyBrandingTab({
  formData,
  uploadingLogo,
  uploadingBanner,
  logoInputRef,
  bannerInputRef,
  onFormDataChange,
  onFileChange,
}: AdminCreateCompanyBrandingTabProps) {
  return (
    <AdminCompanyBrandingPanel>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <AdminCreateCompanyLogoUpload
          imageUrl={formData.brand_logo_url}
          inputRef={logoInputRef}
          uploading={uploadingLogo}
          onFileChange={onFileChange}
          onRemove={() =>
            onFormDataChange((current) => ({ ...current, brand_logo_url: '' }))
          }
        />
        <AdminCreateCompanyBannerUpload
          imageUrl={formData.brand_banner_url}
          inputRef={bannerInputRef}
          uploading={uploadingBanner}
          onFileChange={onFileChange}
          onRemove={() =>
            onFormDataChange((current) => ({ ...current, brand_banner_url: '' }))
          }
        />
      </div>
      <AdminCompanyBrandingColorPalette<CreateCompanyColorKey>
        fields={colorFields}
        values={formData}
        onChange={(key, value) =>
          onFormDataChange((current) => updateCompanyColor(current, key, value))
        }
      />
    </AdminCompanyBrandingPanel>
  )
}
