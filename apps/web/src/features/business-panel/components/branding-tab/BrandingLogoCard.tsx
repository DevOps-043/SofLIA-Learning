'use client'

import { motion } from 'framer-motion'
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react'
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
      style={{
        backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl" />
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
            <h3 className="text-base font-bold text-white">Logo Principal</h3>
            <p className="text-xs text-white/50">Tu imagen de marca</p>
          </div>
        </div>

        <motion.div
          className="relative mb-4 rounded-xl overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,245,245,0.95))',
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
                alt="Logo preview"
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
          style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-white/50" />
          <p className="text-white/70 text-sm font-medium">Arrastra o haz clic</p>
          <p className="text-white/40 text-xs mt-1">PNG, JPG hasta 5MB</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
