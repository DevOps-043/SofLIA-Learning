'use client'

import { motion } from 'framer-motion'
import { Globe, Upload } from 'lucide-react'
import type { BrandingFormState } from './types'

interface BrandingFaviconCardProps {
  branding: BrandingFormState
  onUpload: () => void
}

export function BrandingFaviconCard({
  branding,
  onUpload,
}: BrandingFaviconCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
      style={{
        backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            <Globe className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white">Favicon & Login</h3>
            <p className="text-xs text-white/50">Vista previa del login</p>
          </div>
        </div>

        <motion.div
          className="mb-4 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${branding.color_primary}15, ${branding.color_secondary}10)`,
            border: `1px solid ${branding.color_primary}30`,
            height: '120px',
          }}
        >
          <div className="h-full flex items-center justify-center p-3">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {branding.favicon_url ? (
                  <motion.img
                    src={branding.favicon_url}
                    alt="Favicon"
                    className="w-14 h-14 object-contain"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${branding.color_primary}30` }}
                  >
                    <Globe
                      className="w-7 h-7"
                      style={{ color: branding.color_primary }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="w-28 h-2.5 rounded bg-white/20" />
                <div className="w-28 h-6 rounded bg-white/10 border border-white/20" />
                <div
                  className="w-28 h-5 rounded text-xs flex items-center justify-center text-white font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${branding.color_primary}, ${branding.color_secondary})`,
                  }}
                >
                  Iniciar SesiÃ³n
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={onUpload}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300"
          style={{
            background:
              'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.08))',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            color: '#a78bfa',
          }}
        >
          <Upload className="w-4 h-4" />
          Subir Favicon
        </motion.button>
      </div>
    </motion.div>
  )
}
