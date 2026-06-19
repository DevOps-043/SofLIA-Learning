'use client'

import type { ChangeEvent, Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { CompanyFormData, EditTab } from './company-form.constants'
import { CompanyBrandingTab } from './CompanyBrandingTab'
import { CompanyGeneralTab } from './CompanyGeneralTab'
import { CompanyMembersTab } from './CompanyMembersTab'

interface AdminEditCompanyModalBodyProps {
  activeTab: EditTab
  company: AdminCompany
  formData: CompanyFormData
  isPlanOpen: boolean
  uploadingLogo: boolean
  uploadingBanner: boolean
  imageUploadError: string | null
  logoInputRef: RefObject<HTMLInputElement | null>
  bannerInputRef: RefObject<HTMLInputElement | null>
  onPlanOpenChange: (value: boolean) => void
  onDismissImageError: () => void
  onFileChange: (e: ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'banner') => void
  onUpdateColor: (key: 'brand_color_primary' | 'brand_color_secondary' | 'brand_color_accent', value: string) => void
  onFormDataChange: Dispatch<SetStateAction<CompanyFormData>>
}

export function AdminEditCompanyModalBody(props: AdminEditCompanyModalBodyProps) {
  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-8">
      <AnimatePresence mode="wait">
        {props.activeTab === 'general' ? <CompanyGeneralTab formData={props.formData} isPlanOpen={props.isPlanOpen} setIsPlanOpen={props.onPlanOpenChange} setFormData={props.onFormDataChange} /> : null}
        {props.activeTab === 'members' ? <CompanyMembersTab company={props.company} /> : null}
        {props.activeTab === 'branding' ? <AdminEditCompanyBrandingSection imageUploadError={props.imageUploadError} onDismissImageError={props.onDismissImageError}><CompanyBrandingTab formData={props.formData} uploadingLogo={props.uploadingLogo} uploadingBanner={props.uploadingBanner} logoInputRef={props.logoInputRef} bannerInputRef={props.bannerInputRef} onFileChange={props.onFileChange} onUpdateColor={props.onUpdateColor} setFormData={props.onFormDataChange} /></AdminEditCompanyBrandingSection> : null}
      </AnimatePresence>
    </div>
  )
}

function AdminEditCompanyBrandingSection(props: { imageUploadError: string | null; onDismissImageError: () => void; children: ReactNode }) {
  return (
    <>
      {props.imageUploadError ? <p className="mb-3 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"><span>{props.imageUploadError}</span><button onClick={props.onDismissImageError} className="ml-4 text-red-400 hover:text-red-300">x</button></p> : null}
      {props.children}
    </>
  )
}
