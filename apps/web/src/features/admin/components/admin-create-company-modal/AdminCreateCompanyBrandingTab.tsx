'use client'

import {
  AdminCompanyBrandingColorPalette,
  AdminCompanyBrandingPanel,
} from '../admin-company-branding'
import { AdminCreateCompanyBannerUpload } from './AdminCreateCompanyBannerUpload'
import { AdminCreateCompanyLogoUpload } from './AdminCreateCompanyLogoUpload'
import { updateCompanyColor } from './service'
import type { CreateCompanyData } from './types'

interface AdminCreateCompanyBrandingTabProps {
  formData: CreateCompanyData
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => void
}

const colorFields = [
  { key: 'brand_color_primary', label: 'Primario' },
  { key: 'brand_color_secondary', label: 'Secundario' },
  { key: 'brand_color_accent', label: 'Acento' },
] as const

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
      <AdminCompanyBrandingColorPalette
        fields={colorFields}
        values={formData}
        onChange={(key, value) =>
          onFormDataChange((current) => updateCompanyColor(current, key, value))
        }
      />
    </AdminCompanyBrandingPanel>
  )
}
