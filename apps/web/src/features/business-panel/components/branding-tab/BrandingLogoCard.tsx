'use client'

import { motion } from 'framer-motion'
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BrandingFormState } from './types'

interface BrandingLogoCardProps {
  branding: BrandingFormState
  isDetecting: boolean
  onUpload: () => void
  onDropUpload: (file: File) => void
}

export function BrandingLogoCard({
  branding,
  isDetecting,
  onUpload,
  onDropUpload,
}: BrandingLogoCardProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, ${theme.actionColor} 14.1%, transparent) 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-2.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${branding.color_primary}, ${branding.color_secondary})`,
            }}
          >
            <ImageIcon className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold" style={{ color: theme.textColor }}>
              Logo Principal
            </h3>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Tu imagen de marca
            </p>
          </div>
        </div>

        <motion.div
          className="relative mb-4 rounded-xl overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(245,245,245,0.96))',
            height: '120px',
          }}
        >
          {branding.banner_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-full p-4"
            >
              <img
                src={branding.banner_url}
                alt="Vista previa del logo"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs">Sin logo</p>
            </div>
          )}

          {isDetecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8 mb-2 text-white" />
              </motion.div>
              <p className="text-white text-xs">Detectando colores...</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          onClick={onUpload}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const file = e.dataTransfer.files[0]
            if (file) {
              onDropUpload(file)
            }
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300"
          style={{ borderColor: `color-mix(in srgb, ${theme.actionColor} 20%, transparent)` }}
        >
          <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: theme.actionColor }} />
          <p className="text-sm font-medium" style={{ color: theme.textColor }}>
            Arrastra o haz clic
          </p>
          <p className="text-xs mt-1" style={{ color: theme.subtextColor }}>
            PNG, JPG hasta 5 MB
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
