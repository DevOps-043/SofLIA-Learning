'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BoltIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { PLAN_OPTIONS } from './service'
import type { CreateCompanyData, PlanOption } from './types'

interface AdminCreateCompanyGeneralSectionsProps {
  formData: CreateCompanyData
  isPlanOpen: boolean
  selectedPlan: PlanOption
  onNameChange: (name: string) => void
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onPlanOpenChange: (value: boolean) => void
}

export function AdminCreateCompanyGeneralSections({
  formData,
  isPlanOpen,
  selectedPlan,
  onNameChange,
  onFormDataChange,
  onPlanOpenChange,
}: AdminCreateCompanyGeneralSectionsProps) {
  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider pb-2 border-b border-gray-200 dark:border-white/5">
          <BuildingOffice2Icon className="w-4 h-4" /> Información Básica
        </div>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Nombre de la empresa <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 outline-none transition-all"
              placeholder="Ej. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 ml-1">
                Slug (URL) <span className="text-xs text-gray-500">- auto-generado</span>
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 transition-colors focus-within:border-gray-300 dark:focus-within:border-white/20 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-white/20">
                <span className="text-gray-500 text-sm select-none mr-1">app.SOFLIA.com/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    onFormDataChange((current) => ({ ...current, slug: e.target.value }))
                  }
                  className="flex-1 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:ring-0 outline-none p-0"
                  placeholder="acme"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 ml-1">
                Estado Inicial
              </label>
              <button
                type="button"
                onClick={() =>
                  onFormDataChange((current) => ({ ...current, is_active: !current.is_active }))
                }
                className="w-full h-[50px] flex items-center justify-between px-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
              >
                <span
                  className={`text-sm font-medium ${
                    formData.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formData.is_active ? 'Cuenta Activa' : 'Cuenta Pausada'}
                </span>
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
                    formData.is_active ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
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
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                onFormDataChange((current) => ({ ...current, description: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20 outline-none resize-none transition-all"
              placeholder="Breve descripción de la empresa..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider pb-2 border-b border-gray-200 dark:border-white/5">
          <EnvelopeIcon className="w-4 h-4" /> Contacto
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Email de Contacto
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                onFormDataChange((current) => ({ ...current, contact_email: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 outline-none transition-all"
              placeholder="contacto@empresa.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) =>
                onFormDataChange((current) => ({ ...current, contact_phone: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 outline-none transition-all"
              placeholder="+52 55 1234 5678"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Sitio Web
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                onFormDataChange((current) => ({ ...current, website_url: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 outline-none transition-all"
              placeholder="https://empresa.com"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider pb-2 border-b border-gray-200 dark:border-white/5">
          <BoltIcon className="w-4 h-4" /> Suscripción y Acceso
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 ml-1">Plan</label>
            <button
              type="button"
              onClick={() => onPlanOpenChange(!isPlanOpen)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-between hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: selectedPlan.color }}
                />
                <span>{selectedPlan.label}</span>
              </div>
              <ChevronDownIcon
                className="w-4 h-4 text-gray-500 transition-transform"
                style={{ transform: isPlanOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            <AnimatePresence>
              {isPlanOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 w-full mt-2 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden z-20 shadow-2xl backdrop-blur-xl bg-white dark:bg-carbon-950"
                >
                  {PLAN_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        onFormDataChange((current) => ({
                          ...current,
                          subscription_plan: option.value,
                        }))
                        onPlanOpenChange(false)
                      }}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900 dark:text-white block">
                          {option.label}
                        </span>
                        <span className="text-[10px] text-gray-500">{option.description}</span>
                      </div>
                      {formData.subscription_plan === option.value && (
                        <CheckCircleIcon className="w-4 h-4 text-gray-900 dark:text-white" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 ml-1">
              Usuarios Máximos
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_users}
              onChange={(e) =>
                onFormDataChange((current) => ({
                  ...current,
                  max_users: parseInt(e.target.value, 10) || 1,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:border-gray-300 dark:focus:border-white/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4285F4' }} />
              <span className="text-sm text-gray-900 dark:text-white">Google SSO</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onFormDataChange((current) => ({
                  ...current,
                  google_login_enabled: !current.google_login_enabled,
                }))
              }
              className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                formData.google_login_enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                animate={{ x: formData.google_login_enabled ? 22 : 2 }}
                className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00a6f0' }} />
              <span className="text-sm text-gray-900 dark:text-white">Microsoft SSO</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onFormDataChange((current) => ({
                  ...current,
                  microsoft_login_enabled: !current.microsoft_login_enabled,
                }))
              }
              className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                formData.microsoft_login_enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                animate={{ x: formData.microsoft_login_enabled ? 22 : 2 }}
                className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
