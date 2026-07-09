'use client'

import type { CompanyImageType } from '../admin-company-branding'
import type { ChangeEvent, Dispatch, MutableRefObject, ReactNode, SetStateAction } from 'react'
import { GlobeAltIcon, PhotoIcon } from '@heroicons/react/24/outline'
import {
  AdminCompanyBrandingColorPalette,
  AdminCompanyBrandingPanel,
  AdminCompanyBrandingUploadCard,
} from '../admin-company-branding'
import {
  BRANDING_COLOR_FIELDS,
  type BrandingColorKey,
  type CompanyFormData,
} from './company-form.constants'

interface CompanyBrandingTabProps {
  formData: CompanyFormData
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  onFileChange: (event: ChangeEvent<HTMLInputElement>, imageType: CompanyImageType) => void
  onUpdateColor: (key: BrandingColorKey, value: string) => void
  setFormData: Dispatch<SetStateAction<CompanyFormData>>
}

export function CompanyBrandingTab({
  formData,
  uploadingLogo,
  uploadingBanner,
  logoInputRef,
  bannerInputRef,
  onFileChange,
  onUpdateColor,
  setFormData,
}: CompanyBrandingTabProps) {
  return (
    <AdminCompanyBrandingPanel>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <AdminEditCompanyUploadCard
          label="Logo de la Empresa"
          emptyLabel="Subir logo"
          emptyHint="PNG, JPG, SVG (max. 5MB)"
          actionLabel="Cambiar logo"
          imageType="logo"
          imageUrl={formData.brand_logo_url}
          inputRef={logoInputRef}
          uploading={uploadingLogo}
          onFileChange={onFileChange}
          onRemove={() => setFormData((prev) => ({ ...prev, brand_logo_url: '' }))}
          icon={<PhotoIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
        />
        <AdminEditCompanyUploadCard
          label="Banner de Marca"
          emptyLabel="Subir banner"
          emptyHint="PNG, JPG (max. 10MB)"
          actionLabel="Cambiar banner"
          imageType="banner"
          imageUrl={formData.brand_banner_url}
          inputRef={bannerInputRef}
          uploading={uploadingBanner}
          onFileChange={onFileChange}
          onRemove={() =>
            setFormData((prev) => ({ ...prev, brand_banner_url: '' }))
          }
          objectFit="cover"
          icon={<GlobeAltIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
        />
      </div>
      <AdminCompanyBrandingColorPalette
        fields={BRANDING_COLOR_FIELDS.map((field) => ({
          key: field.k,
          label: field.l,
        }))}
        values={formData}
        onChange={onUpdateColor}
        dark
      />
    </AdminCompanyBrandingPanel>
  )
}

interface AdminEditCompanyUploadCardProps {
  label: string
  emptyLabel: string
  emptyHint: string
  actionLabel: string
  imageType: CompanyImageType
  imageUrl: string
  inputRef: MutableRefObject<HTMLInputElement | null>
  uploading: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>, imageType: CompanyImageType) => void
  onRemove: () => void
  icon: ReactNode
  objectFit?: 'contain' | 'cover'
}

function AdminEditCompanyUploadCard(props: AdminEditCompanyUploadCardProps) {
  return <AdminCompanyBrandingUploadCard {...props} />
}
