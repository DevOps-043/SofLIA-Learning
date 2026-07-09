'use client'

import { GlobeAltIcon, PhotoIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline'
import { AdminCompanyBrandingUploadCard } from '@/features/admin/components/admin-company-branding'
import { Card, colors } from '../shared'
import { CustomizationBrandingPreview } from './CustomizationBrandingPreview'
import { useBrandingImageUpload } from './useBrandingImageUpload'
import type { CustomizationSectionProps } from './types'

export function CustomizationBrandingCard({ company, setCompany }: CustomizationSectionProps) {
  const logoUrl = company.brand_logo_url || company.logo_url || ''
  const upload = useBrandingImageUpload({ company, setCompany })

  return (
    <Card title="Branding" description="Logos y recursos visuales" icon={PhotoIcon} iconColor={colors.purple}>
      {upload.uploadError ? (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {upload.uploadError}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminCompanyBrandingUploadCard
          label="Logo de la Empresa"
          emptyLabel="Subir logo"
          emptyHint="PNG, JPG, SVG (max. 5MB)"
          actionLabel="Cambiar logo"
          imageType="logo"
          imageUrl={logoUrl}
          inputRef={upload.logoInputRef}
          uploading={upload.uploadingLogo}
          onFileChange={upload.handleFileChange}
          onRemove={() => upload.removeImage('logo')}
          icon={<PhotoIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
        />
        <AdminCompanyBrandingUploadCard
          label="Banner de Marca"
          emptyLabel="Subir banner"
          emptyHint="PNG, JPG (max. 10MB)"
          actionLabel="Cambiar banner"
          imageType="banner"
          imageUrl={company.brand_banner_url || ''}
          inputRef={upload.bannerInputRef}
          uploading={upload.uploadingBanner}
          onFileChange={upload.handleFileChange}
          onRemove={() => upload.removeImage('banner')}
          objectFit="cover"
          icon={<GlobeAltIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
        />
        <AdminCompanyBrandingUploadCard
          label="Favicon"
          emptyLabel="Subir favicon"
          emptyHint="PNG, JPG (max. 5MB)"
          actionLabel="Cambiar favicon"
          imageType="favicon"
          imageUrl={company.brand_favicon_url || ''}
          inputRef={upload.faviconInputRef}
          uploading={upload.uploadingFavicon}
          onFileChange={upload.handleFileChange}
          onRemove={() => upload.removeImage('favicon')}
          icon={<Square3Stack3DIcon className="h-10 w-10 text-gray-500 transition-colors group-hover:text-accent" />}
        />
      </div>
      <CustomizationBrandingPreview bannerUrl={company.brand_banner_url} logoUrl={logoUrl} />
    </Card>
  )
}
