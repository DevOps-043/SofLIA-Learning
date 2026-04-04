'use client'

import { useState, useRef } from 'react'
import type { AdminCompany } from '../../types/admin-companies.types'
import { colors, CompanyFormData, BrandingColorKey, THEME_PRESETS, EditTab } from './company-form.constants'

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
    brand_color_primary: company.brand_color_primary || colors.primary,
    brand_color_secondary: company.brand_color_secondary || colors.bgSecondary,
    brand_color_accent: company.brand_color_accent || colors.accent,
    brand_font_family: company.brand_font_family || 'Inter',
  })
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File, imageType: 'logo' | 'banner') => {
    const slug = formData.slug || company.slug || 'temp-org'
    try {
      if (imageType === 'logo') setUploadingLogo(true)
      else setUploadingBanner(true)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('organizationSlug', slug)
      formDataUpload.append('imageType', imageType)

      const response = await fetch('/api/admin/upload/organization-image', {
        method: 'POST',
        body: formDataUpload,
      })
      const result = await response.json()

      if (result.success && result.image?.url) {
        if (imageType === 'logo') {
          setFormData(prev => ({
            ...prev,
            brand_logo_url: result.image.url,
            brand_favicon_url: result.image.favicon_url || result.image.url,
          }))
        } else {
          setFormData(prev => ({ ...prev, brand_banner_url: result.image.url }))
        }
      } else {
        console.error('Upload failed:', result.error)
        alert(result.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error al subir la imagen')
    } finally {
      if (imageType === 'logo') setUploadingLogo(false)
      else setUploadingBanner(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file, imageType)
  }

  const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      brand_color_primary: preset.primary,
      brand_color_secondary: preset.secondary,
      brand_color_accent: preset.accent,
    }))
  }

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
    uploadingLogo,
    uploadingBanner,
    logoInputRef,
    bannerInputRef,
    handleFileChange,
    applyThemePreset,
    updateBrandingColor,
  }
}
