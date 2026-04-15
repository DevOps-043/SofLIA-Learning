'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOffice2Icon, CheckCircleIcon, PauseCircleIcon, XMarkIcon,
  GlobeAltIcon, SparklesIcon, ChartBarIcon, EyeIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { AdminCompany } from '../../types/admin-companies.types'
import { useCompanyFormState } from './useCompanyFormState'
import { CompanyGeneralTab } from './CompanyGeneralTab'
import { CompanyMembersTab } from './CompanyMembersTab'
import { CompanyBrandingTab } from './CompanyBrandingTab'
import { CompanyThemesTab } from './CompanyThemesTab'
import { colors } from './company-form.constants'

interface EditModalProps {
  company: AdminCompany
  onClose: () => void
  onSave: (updates: Partial<AdminCompany>) => Promise<void>
  isSaving: boolean
}

export function AdminEditCompanyModal({ company, onClose, onSave, isSaving }: EditModalProps) {
  const {
    activeTab, setActiveTab, formData, setFormData,
    isPlanOpen, setIsPlanOpen,
    uploadingLogo, uploadingBanner,
    imageUploadError, setImageUploadError,
    logoInputRef, bannerInputRef,
    handleFileChange, applyThemePreset, updateBrandingColor,
  } = useCompanyFormState(company)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const primaryColor = formData.brand_color_primary || colors.primary
  const accentColor = formData.brand_color_accent || colors.accent

  const navItems = [
    { id: 'general' as const, label: 'General', icon: BuildingOffice2Icon, description: 'Info básica y contacto' },
    { id: 'members' as const, label: 'Miembros', icon: ChartBarIcon, description: 'Estadísticas y admins' },
    { id: 'branding' as const, label: 'Branding', icon: SparklesIcon, description: 'Logo, colores y marca' },
    { id: 'themes' as const, label: 'Temas', icon: EyeIcon, description: 'Estilos predefinidos' },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[700px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-white/10"
          style={{ backgroundColor: colors.bgSecondary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div
            className="hidden lg:flex w-[320px] flex-col p-8 border-r border-white/5 relative shrink-0"
            style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 text-center mb-8">
              <motion.div className="relative inline-block mb-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/10 mx-auto bg-white/5 backdrop-blur-sm"
                  style={{ background: formData.brand_logo_url ? '#fff' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  {formData.brand_logo_url
                    ? <img src={formData.brand_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                    : <BuildingOffice2Icon className="w-10 h-10 text-white" />}
                </div>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg border border-bgSecondary"
                  style={{ backgroundColor: formData.is_active ? colors.success : colors.warning }}
                >
                  {formData.is_active
                    ? <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                    : <PauseCircleIcon className="w-3.5 h-3.5 text-white" />}
                </motion.div>
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-1 truncate px-2">{formData.name || 'Nueva Empresa'}</h3>
              <div className="flex items-center justify-center gap-2 opacity-70">
                <GlobeAltIcon className="w-3 h-3 text-current" style={{ color: accentColor }} />
                <p className="text-xs font-mono text-white/80">{formData.slug ? `/${formData.slug}` : '/...'}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 relative z-10">
              {navItems.map(item => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative overflow-hidden group ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-white/10 ring-1 ring-white/10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon
                      className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                      style={{ color: isActive ? accentColor : undefined }}
                    />
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</p>
                      <p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-500'}`}>{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Licencias</p>
                    <p className="text-lg font-bold text-white leading-none mt-1">
                      {company.active_users} <span className="text-xs font-normal text-gray-500">/ {formData.max_users}</span>
                    </p>
                  </div>
                  <ChartBarIcon className="w-5 h-5 opacity-20 text-white" />
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (company.active_users / formData.max_users) * 100)}%`, backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col h-full bg-[#1E2329] min-w-0">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Empresa</h2>
                <p className="text-sm text-gray-400 mt-1">Configuración y preferencias de {company.name}</p>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <CompanyGeneralTab
                    formData={formData}
                    isPlanOpen={isPlanOpen}
                    setIsPlanOpen={setIsPlanOpen}
                    setFormData={setFormData}
                  />
                )}
                {activeTab === 'members' && <CompanyMembersTab company={company} />}
                {activeTab === 'branding' && (
                  <>
                    {imageUploadError && (
                      <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center justify-between">
                        <span>{imageUploadError}</span>
                        <button onClick={() => setImageUploadError(null)} className="ml-4 text-red-400 hover:text-red-300">×</button>
                      </p>
                    )}
                    <CompanyBrandingTab
                      formData={formData}
                      uploadingLogo={uploadingLogo}
                      uploadingBanner={uploadingBanner}
                      logoInputRef={logoInputRef}
                      bannerInputRef={bannerInputRef}
                      onFileChange={handleFileChange}
                      onUpdateColor={updateBrandingColor}
                      setFormData={setFormData}
                    />
                  </>
                )}
                {activeTab === 'themes' && (
                  <CompanyThemesTab formData={formData} onApplyPreset={applyThemePreset} />
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-end gap-3 bg-[#1E2329]">
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, boxShadow: `0 4px 20px ${primaryColor}40` }}
              >
                {isSaving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
