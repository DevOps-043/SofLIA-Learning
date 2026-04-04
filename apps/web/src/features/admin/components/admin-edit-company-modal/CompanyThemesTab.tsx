'use client'

import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { THEME_PRESETS, CompanyFormData } from './company-form.constants'

interface CompanyThemesTabProps {
  formData: CompanyFormData
  onApplyPreset: (preset: typeof THEME_PRESETS[0]) => void
}

export function CompanyThemesTab({ formData, onApplyPreset }: CompanyThemesTabProps) {
  return (
    <motion.div
      key="themes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="text-sm text-gray-400 border-b border-white/5 pb-4 mb-6">
        Selecciona un tema predefinido para aplicar colores automáticamente. Puedes personalizarlos después en la pestaña Branding.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEME_PRESETS.map(preset => {
          const isActive =
            formData.brand_color_primary === preset.primary &&
            formData.brand_color_accent === preset.accent
          return (
            <div
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 group hover:scale-[1.02] ${isActive ? 'bg-white/5 border-accent shadow-lg' : 'bg-transparent border-white/10 hover:border-white/30 hover:bg-white/5'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={`font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {preset.name}
                  </h4>
                  {isActive && <CheckCircleIcon className="w-5 h-5 text-accent" />}
                </div>
                <p className="text-xs text-gray-500 mb-4 h-8">{preset.description}</p>
                <div className="flex gap-2">
                  {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110"
                      style={{ backgroundColor: c, transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
