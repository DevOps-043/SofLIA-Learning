'use client'

import { PhotoIcon } from '@heroicons/react/24/outline'
import { Card, colors, InputField } from '../shared'
import { GeneralBrandingPreview } from './GeneralBrandingPreview'
import type { GeneralSectionProps } from './types'

export function GeneralBrandingCard({ company, setCompany }: GeneralSectionProps) {
  const logoUrl = company.brand_logo_url || company.logo_url || ''

  return (
    <Card title="Branding" description="Logos y recursos visuales" icon={PhotoIcon} iconColor={colors.purple}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InputField label="URL del Logo" value={logoUrl} onChange={(value) => setCompany({ ...company, brand_logo_url: value })} placeholder="https://..." />
        <InputField label="URL del Banner" value={company.brand_banner_url || ''} onChange={(value) => setCompany({ ...company, brand_banner_url: value })} placeholder="https://..." />
        <InputField label="URL del Favicon" value={company.brand_favicon_url || ''} onChange={(value) => setCompany({ ...company, brand_favicon_url: value })} placeholder="https://..." />
      </div>
      <GeneralBrandingPreview bannerUrl={company.brand_banner_url} logoUrl={logoUrl} />
    </Card>
  )
}
