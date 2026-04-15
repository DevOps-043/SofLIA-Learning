'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  AdminCreateCompanyBrandingTab,
  AdminCreateCompanyGeneralTab,
  AdminCreateCompanyOwnerTab,
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
  const {
    activeTab,
    formData,
    isPlanOpen,
    uploadingLogo,
    uploadingBanner,
    imageUploadError,
    setImageUploadError,
    logoInputRef,
    bannerInputRef,
    setActiveTab,
    setFormData,
    setIsPlanOpen,
    handleFileChange,
    handleNameChange,
  } = useAdminCreateCompanyModal()

  const selectedPlan = getSelectedPlan(formData.subscription_plan)
  const primaryColor = formData.brand_color_primary
  const accentColor = formData.brand_color_accent
  const isFormValid = isCreateCompanyFormValid(formData)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!formData.name.trim()) {
      return
    }
    await onCreate(formData)
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-md bg-carbon-900/75"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[700px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-carbon-950"
          onClick={(e) => e.stopPropagation()}
        >
          <AdminCreateCompanySidebar
            activeTab={activeTab}
            formData={formData}
            selectedPlan={selectedPlan}
            primaryColor={primaryColor}
            accentColor={accentColor}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 flex flex-col h-full bg-white dark:bg-carbon-900 min-w-0">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <PlusIcon className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Nueva Organización
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
                  Crea una nueva empresa en la plataforma SOFLIA
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <AdminCreateCompanyGeneralTab
                    formData={formData}
                    isPlanOpen={isPlanOpen}
                    selectedPlan={selectedPlan}
                    onNameChange={handleNameChange}
                    onPlanOpenChange={setIsPlanOpen}
                    onFormDataChange={(updater) =>
                      setFormData((current) => updater(current))
                    }
                  />
                )}

                {activeTab === 'branding' && (
                  <>
                    {imageUploadError && (
                      <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center justify-between">
                        <span>{imageUploadError}</span>
                        <button onClick={() => setImageUploadError(null)} className="ml-4 text-red-400 hover:text-red-300">×</button>
                      </p>
                    )}
                    <AdminCreateCompanyBrandingTab
                      formData={formData}
                      uploadingLogo={uploadingLogo}
                      uploadingBanner={uploadingBanner}
                      logoInputRef={logoInputRef}
                      bannerInputRef={bannerInputRef}
                      onFormDataChange={(updater) =>
                        setFormData((current) => updater(current))
                      }
                      onFileChange={handleFileChange}
                    />
                  </>
                )}

                {activeTab === 'owner' && (
                  <AdminCreateCompanyOwnerTab
                    accentColor={accentColor}
                    formData={formData}
                    onFormDataChange={(updater) =>
                      setFormData((current) => updater(current))
                    }
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/5 shrink-0 flex items-center justify-between bg-white dark:bg-carbon-900">
              <p className="text-xs text-gray-500">
                {isFormValid ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Listo para crear
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Completa nombre y email del propietario
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={isCreating || !isFormValid}
                  className="px-8 py-2.5 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                  }}
                >
                  {isCreating && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                  {isCreating ? 'Creando...' : 'Crear Organización'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
