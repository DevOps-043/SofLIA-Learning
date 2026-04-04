'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BuildingOffice2Icon, EnvelopeIcon, BoltIcon, CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { CompanyFormData, PLAN_OPTIONS, colors } from './company-form.constants'

interface CompanyGeneralTabProps {
  formData: CompanyFormData
  isPlanOpen: boolean
  setIsPlanOpen: (open: boolean) => void
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>
}

export function CompanyGeneralTab({ formData, isPlanOpen, setIsPlanOpen, setFormData }: CompanyGeneralTabProps) {
  const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.subscription_plan) || PLAN_OPTIONS[0]

  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-3xl"
    >
      {/* Basic Info */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
          <BuildingOffice2Icon className="w-4 h-4" /> Información Básica
        </div>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
              Nombre de la empresa <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all"
              placeholder="Ej. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Slug (URL)</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20">
                <span className="text-gray-500 text-sm select-none mr-1">app.SOFLIA.com/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 bg-transparent border-none text-white placeholder-white/20 focus:ring-0 outline-none p-0"
                  placeholder="acme"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Estado</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className="w-full h-[50px] flex items-center justify-between px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <span className={`text-sm font-medium ${formData.is_active ? 'text-white' : 'text-gray-400'}`}>
                  {formData.is_active ? 'Cuenta Activa' : 'Cuenta Pausada'}
                </span>
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${formData.is_active ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <motion.div
                    animate={{ x: formData.is_active ? 22 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none resize-none transition-all"
              placeholder="Breve descripción de la empresa..."
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
          <EnvelopeIcon className="w-4 h-4" /> Contacto
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-gray-400 mb-2 ml-1">Email de Contacto</label>
            <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 ml-1">Teléfono</label>
            <input type="tel" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-2 ml-1">Sitio Web</label>
            <input type="url" value={formData.website_url} onChange={e => setFormData({ ...formData, website_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" placeholder="https://" />
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
          <BoltIcon className="w-4 h-4" /> Suscripción
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs text-gray-400 mb-2 ml-1">Plan Actual</label>
            <button type="button" onClick={() => setIsPlanOpen(!isPlanOpen)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: selectedPlan.color }} />
                <span>{selectedPlan.label}</span>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-500 transition-transform" style={{ transform: isPlanOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            <AnimatePresence>
              {isPlanOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 w-full mt-2 rounded-xl border border-white/10 overflow-hidden z-20 shadow-2xl backdrop-blur-xl"
                  style={{ backgroundColor: colors.bgTertiary }}
                >
                  {PLAN_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => { setFormData({ ...formData, subscription_plan: opt.value }); setIsPlanOpen(false) }} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                      <div className="flex-1">
                        <span className="text-sm text-white block">{opt.label}</span>
                        <span className="text-[10px] text-gray-500">{opt.description}</span>
                      </div>
                      {formData.subscription_plan === opt.value && <CheckCircleIcon className="w-4 h-4 text-white" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 ml-1">Usuarios Máximos</label>
            <input type="number" min="1" value={formData.max_users} onChange={e => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
