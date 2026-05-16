'use client'

import type { ChangeEvent, MutableRefObject } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AdminCreateCompanyBrandingTab } from './AdminCreateCompanyBrandingTab'
import { AdminCreateCompanyGeneralTab } from './AdminCreateCompanyGeneralTab'
import { AdminCreateCompanyImageUploadError } from './AdminCreateCompanyImageUploadError'
import { AdminCreateCompanyOwnerTab } from './AdminCreateCompanyOwnerTab'
import type { CreateCompanyData, CreateTab, PlanOption } from './types'

interface AdminCreateCompanyModalContentProps {
  activeTab: CreateTab
  accentColor: string
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  formData: CreateCompanyData
  imageUploadError: string | null
  isPlanOpen: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  selectedPlan: PlanOption
  uploadingBanner: boolean
  uploadingLogo: boolean
  onDismissImageError: () => void
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => void
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onNameChange: (name: string) => void
  onPlanOpenChange: (value: boolean) => void
}

export function AdminCreateCompanyModalContent({
  activeTab,
  accentColor,
  bannerInputRef,
  formData,
  imageUploadError,
  isPlanOpen,
  logoInputRef,
  selectedPlan,
  uploadingBanner,
  uploadingLogo,
  onDismissImageError,
  onFileChange,
  onFormDataChange,
  onNameChange,
  onPlanOpenChange,
}: AdminCreateCompanyModalContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <AnimatePresence mode="wait">
        {activeTab === 'general' ? (
          <AdminCreateCompanyGeneralTab
            formData={formData}
            isPlanOpen={isPlanOpen}
            selectedPlan={selectedPlan}
            onNameChange={onNameChange}
            onPlanOpenChange={onPlanOpenChange}
            onFormDataChange={onFormDataChange}
          />
        ) : null}

        {activeTab === 'branding' ? (
          <>
            {imageUploadError ? (
              <AdminCreateCompanyImageUploadError
                error={imageUploadError}
                onDismiss={onDismissImageError}
              />
            ) : null}
            <AdminCreateCompanyBrandingTab
              formData={formData}
              uploadingLogo={uploadingLogo}
              uploadingBanner={uploadingBanner}
              logoInputRef={logoInputRef}
              bannerInputRef={bannerInputRef}
              onFormDataChange={onFormDataChange}
              onFileChange={onFileChange}
            />
          </>
        ) : null}

        {activeTab === 'owner' ? (
          <AdminCreateCompanyOwnerTab
            accentColor={accentColor}
            formData={formData}
            onFormDataChange={onFormDataChange}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
