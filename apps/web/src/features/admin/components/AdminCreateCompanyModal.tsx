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
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(10, 37, 64, 0.75)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[700px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-white/10"
          style={{ backgroundColor: '#0A0D12' }}
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

          <div className="flex-1 flex flex-col h-full bg-[#1E2329] min-w-0">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <PlusIcon className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Nueva OrganizaciÃ³n
                  </h2>
                </div>
                <p className="text-sm text-gray-400 ml-12">
                  Crea una nueva empresa en la plataforma SOFLIA
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
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

            <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between bg-[#1E2329]">
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
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
                  {isCreating ? 'Creando...' : 'Crear OrganizaciÃ³n'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
