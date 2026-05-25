'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AdminCompany } from '../../types/admin-companies.types'
import { useCompanyFormState } from './useCompanyFormState'
import { colors } from './company-form.constants'
import { AdminEditCompanyModalBody } from './AdminEditCompanyModalBody'
import { AdminEditCompanyModalFooter } from './AdminEditCompanyModalFooter'
import { AdminEditCompanyModalHeader } from './AdminEditCompanyModalHeader'
import { AdminEditCompanyModalSidebar } from './AdminEditCompanyModalSidebar'

interface EditModalProps {
  company: AdminCompany
  onClose: () => void
  onSave: (updates: Partial<AdminCompany>) => Promise<void>
  isSaving: boolean
}

export function AdminEditCompanyModal({ company, onClose, onSave, isSaving }: EditModalProps) {
  const state = useCompanyFormState(company)
  const primaryColor = state.formData.brand_color_primary || colors.primary
  const accentColor = state.formData.brand_color_accent || colors.accent

  return (
    <AnimatePresence>
      {/*
        `dark`: este modal es un diseño dark-glass (text-white, bordes white/10,
        superficies semitransparentes). Sus tokens `var(--color-gray-*)` se
        invierten en modo claro y dejaban el fondo claro con texto blanco
        invisible. Forzar el scope `dark` resuelve todos los tokens y variantes
        `dark:` del subárbol en su modo de diseño, independiente del tema global.
      */}
      <div className="dark fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex h-[700px] max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:flex-row" style={{ backgroundColor: colors.bgSecondary }} onClick={(e) => e.stopPropagation()}>
          <AdminEditCompanyModalSidebar activeTab={state.activeTab} company={company} formData={state.formData} primaryColor={primaryColor} accentColor={accentColor} onTabChange={state.setActiveTab} />
          <div className="flex min-w-0 flex-1 flex-col h-full bg-carbon-800">
            <AdminEditCompanyModalHeader companyName={company.name} onClose={onClose} />
            <AdminEditCompanyModalBody activeTab={state.activeTab} company={company} formData={state.formData} isPlanOpen={state.isPlanOpen} uploadingLogo={state.uploadingLogo} uploadingBanner={state.uploadingBanner} imageUploadError={state.imageUploadError} logoInputRef={state.logoInputRef} bannerInputRef={state.bannerInputRef} onPlanOpenChange={state.setIsPlanOpen} onDismissImageError={() => state.setImageUploadError(null)} onFileChange={state.handleFileChange} onApplyPreset={state.applyThemePreset} onUpdateColor={state.updateBrandingColor} onFormDataChange={state.setFormData} />
            <AdminEditCompanyModalFooter isSaving={isSaving} primaryColor={primaryColor} accentColor={accentColor} onClose={onClose} onSave={() => void onSave(state.formData)} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
