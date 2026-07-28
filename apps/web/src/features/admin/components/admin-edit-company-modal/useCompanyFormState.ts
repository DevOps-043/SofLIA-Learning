'use client'

import { useState } from 'react'
import type { AdminCompany } from '../../types/admin-companies.types'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  normalizeBrandHexColor,
} from '../../services/admin-companies/admin-company-brand-colors'
import { CompanyFormData, BrandingColorKey, EditTab } from './company-form.constants'
import { useCompanyImageUpload } from './useCompanyImageUpload'

export function useCompanyFormState(company: AdminCompany) {
  const [activeTab, setActiveTab] = useState<EditTab>('general')
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company.name || '',
    slug: company.slug || '',
    description: company.description || '',
    contact_email: company.contact_email || '',
    contact_phone: company.contact_phone || '',
    website_url: company.website_url || '',
    subscription_plan: company.subscription_plan || 'team',
    max_users: company.max_users || 10,
    is_active: company.is_active,
    brand_logo_url: company.brand_logo_url || '',
    brand_banner_url: company.brand_banner_url || '',
    brand_favicon_url: company.brand_favicon_url || '',
    brand_color_primary: normalizeBrandHexColor(company.brand_color_primary, DEFAULT_BRAND_PRIMARY),
    brand_color_secondary: normalizeBrandHexColor(company.brand_color_secondary, DEFAULT_BRAND_SECONDARY),
    brand_color_accent: normalizeBrandHexColor(company.brand_color_accent, DEFAULT_BRAND_ACCENT),
    brand_font_family: company.brand_font_family || 'Inter Tight',
  })
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const uploadState = useCompanyImageUpload({
    slug: formData.slug || company.slug || 'temp-org',
    onLogoUploaded: (logoUrl, faviconUrl) =>
      setFormData((prev) => ({
        ...prev,
        brand_logo_url: logoUrl,
        brand_favicon_url: faviconUrl,
      })),
    onBannerUploaded: (bannerUrl) =>
      setFormData((prev) => ({ ...prev, brand_banner_url: bannerUrl })),
  })

  const updateBrandingColor = (key: BrandingColorKey, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return {
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    isPlanOpen,
    setIsPlanOpen,
    updateBrandingColor,
    ...uploadState,
  }
}
