import { useState } from 'react'
import { createCompanySlug, createInitialCompanyData } from './service'
import type { CreateCompanyData, CreateTab } from './types'
import { useAdminCreateCompanyUpload } from './useAdminCreateCompanyUpload'

export function useAdminCreateCompanyModal() {
  const [activeTab, setActiveTab] = useState<CreateTab>('general')
  const [formData, setFormData] = useState<CreateCompanyData>(
    createInitialCompanyData(),
  )
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const uploadState = useAdminCreateCompanyUpload({
    slug: formData.slug || `new-org-${Date.now()}`,
    onLogoUploaded: (logoUrl, faviconUrl) =>
      setFormData((current) => ({
        ...current,
        brand_logo_url: logoUrl,
        brand_favicon_url: faviconUrl,
      })),
    onBannerUploaded: (bannerUrl) =>
      setFormData((current) => ({ ...current, brand_banner_url: bannerUrl })),
  })

  const handleNameChange = (name: string) => {
    setFormData((current) => ({
      ...current,
      name,
      slug: createCompanySlug(name),
    }))
  }

  return {
    activeTab,
    formData,
    isPlanOpen,
    setActiveTab,
    setFormData,
    setIsPlanOpen,
    handleNameChange,
    ...uploadState,
  }
}
