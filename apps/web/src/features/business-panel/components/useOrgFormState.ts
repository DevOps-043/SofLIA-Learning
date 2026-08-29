'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { type OrganizationData } from '../hooks/useBusinessSettings'
import type { BrandingData, BrandingUpdateResult } from '../hooks/useBranding'

export interface OrgFormData {
  name: string
  description: string
  contact_email: string
  contact_phone: string
  website_url: string
  logo_url: string
  show_navbar_name: boolean
  banner_url: string
  icon_url: string
  industry: string
  company_size: string
  company_type: string
  company_mission: string
  company_country: string
}

interface UseOrgFormStateProps {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  branding: BrandingData | null
  updateBranding: (data: Partial<BrandingData>) => Promise<BrandingUpdateResult>
  showToast: (msg: string, type?: ToastType) => void
}

export function useOrgFormState({
  organization,
  updateOrganization,
  branding,
  updateBranding,
  showToast,
}: UseOrgFormStateProps) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [formData, setFormData] = useState<OrgFormData>({
    name: organization?.name || '',
    description: organization?.description || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    website_url: organization?.website_url || '',
    logo_url: organization?.logo_url || '',
    show_navbar_name: organization?.show_navbar_name ?? true,
    banner_url: branding?.banner_url || '',
    icon_url: organization?.logo_url || '',
    industry: organization?.industry || '',
    company_size: organization?.company_size || '',
    company_type: organization?.company_type || '',
    company_mission: organization?.company_mission || '',
    company_country: organization?.company_country || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (organization) {
      setFormData(prev => ({
        ...prev,
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        show_navbar_name: organization.show_navbar_name ?? true,
        icon_url: organization.logo_url || '',
        industry: organization.industry || '',
        company_size: organization.company_size || '',
        company_type: organization.company_type || '',
        company_mission: organization.company_mission || '',
        company_country: organization.company_country || '',
      }))
    }
    if (branding) {
      setFormData(prev => ({
        ...prev,
        banner_url: branding.banner_url || '',
      }))
    }
  }, [organization, branding])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const updateData: Partial<OrganizationData> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website_url: formData.website_url.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        show_navbar_name: formData.show_navbar_name,
        industry: formData.industry.trim() || null,
        company_size: formData.company_size.trim() || null,
        company_type: formData.company_type.trim() || null,
        company_mission: formData.company_mission.trim() || null,
        company_country: formData.company_country.trim() || null,
      }

      const successOrg = await updateOrganization(updateData)

      let successBranding = true
      if (formData.banner_url !== branding?.banner_url) {
        const brandingResult = await updateBranding({ banner_url: formData.banner_url })
        successBranding = brandingResult.success
      }

      if (successOrg && successBranding) {
        showToast('Datos de la empresa actualizados correctamente')
      } else {
        showToast('Error al actualizar los datos', 'error')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar los datos', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        show_navbar_name: organization.show_navbar_name ?? true,
        banner_url: branding?.banner_url || '',
        icon_url: organization.logo_url || '',
        industry: organization.industry || '',
        company_size: organization.company_size || '',
        company_type: organization.company_type || '',
        company_mission: organization.company_mission || '',
        company_country: organization.company_country || '',
      })
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedFields(prev => ({ ...prev, [field]: true }))
          setTimeout(() => {
            setCopiedFields(prev => ({ ...prev, [field]: false }))
          }, 2000)
        })
        .catch(() => {
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          setCopiedFields(prev => ({ ...prev, [field]: true }))
          setTimeout(() => {
            setCopiedFields(prev => ({ ...prev, [field]: false }))
          }, 2000)
        })
    }
  }

  const uploadBanner = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('bucket', 'Panel-Business')
        fd.append('folder', 'Banner-Empresa')
        try {
          const response = await fetch('/api/upload', { method: 'POST', body: fd })
          const result = await response.json()
          if (result.success && result.url) {
            setFormData(prev => ({ ...prev, banner_url: result.url }))
          }
        } catch {
          showToast('Error al subir el banner', 'error')
        }
      }
    }
    input.click()
  }

  const uploadLogo = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('bucket', 'Panel-Business')
        fd.append('folder', 'Logo-Empresa')
        try {
          const response = await fetch('/api/upload', { method: 'POST', body: fd })
          const result = await response.json()
          if (result.success && result.url) {
            setFormData(prev => ({ ...prev, icon_url: result.url, logo_url: result.url }))
          }
        } catch {
          showToast('Error al subir el logo', 'error')
        }
      }
    }
    input.click()
  }

  return {
    orgSlug,
    formData,
    setFormData,
    isSaving,
    copiedFields,
    handleChange,
    handleSubmit,
    handleDiscard,
    copyToClipboard,
    uploadBanner,
    uploadLogo,
  }
}
