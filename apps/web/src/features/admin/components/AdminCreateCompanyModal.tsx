'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AdminCreateCompanyModalContent,
  AdminCreateCompanyModalFooter,
  AdminCreateCompanyModalHeader,
  AdminCreateCompanySidebar,
  getSelectedPlan,
  isCreateCompanyFormValid,
  useAdminCreateCompanyModal,
} from './admin-create-company-modal'
import type { CreateModalProps } from './admin-create-company-modal'

export function AdminCreateCompanyModal({
  onClose,
  onCreate,
  isCreating,
}: CreateModalProps) {
  const state = useAdminCreateCompanyModal()
  const selectedPlan = getSelectedPlan(state.formData.subscription_plan)
  const primaryColor = state.formData.brand_color_primary
  const accentColor = state.formData.brand_color_accent
  const isFormValid = isCreateCompanyFormValid(state.formData)

  const handleSubmit = async () => {
    if (!state.formData.name.trim()) return
    await onCreate(state.formData)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-carbon-900/75 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(event) => event.stopPropagation()}
          className="relative flex h-[700px] max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl dark:border-white/10 dark:bg-carbon-950 lg:flex-row"
        >
          <AdminCreateCompanySidebar
            activeTab={state.activeTab}
            formData={state.formData}
            selectedPlan={selectedPlan}
            primaryColor={primaryColor}
            accentColor={accentColor}
            onTabChange={state.setActiveTab}
          />
          <div className="flex h-full min-w-0 flex-1 flex-col bg-white dark:bg-carbon-900">
            <AdminCreateCompanyModalHeader accentColor={accentColor} onClose={onClose} />
            <AdminCreateCompanyModalContent
              activeTab={state.activeTab}
              accentColor={accentColor}
              bannerInputRef={state.bannerInputRef}
              formData={state.formData}
              imageUploadError={state.imageUploadError}
              isPlanOpen={state.isPlanOpen}
              logoInputRef={state.logoInputRef}
              selectedPlan={selectedPlan}
              uploadingBanner={state.uploadingBanner}
              uploadingLogo={state.uploadingLogo}
              onDismissImageError={() => state.setImageUploadError(null)}
              onFileChange={state.handleFileChange}
              onFormDataChange={(updater) => state.setFormData((current) => updater(current))}
              onNameChange={state.handleNameChange}
              onPlanOpenChange={state.setIsPlanOpen}
            />
            <AdminCreateCompanyModalFooter
              accentColor={accentColor}
              isCreating={isCreating}
              isFormValid={isFormValid}
              onClose={onClose}
              onSubmit={() => void handleSubmit()}
              primaryColor={primaryColor}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
