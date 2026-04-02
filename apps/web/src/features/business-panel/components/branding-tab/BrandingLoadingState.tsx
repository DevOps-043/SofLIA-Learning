'use client'

import { motion } from 'framer-motion'

export function BrandingLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full mb-6"
        style={{
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--org-primary-button-color, #3b82f6)',
        }}
      />
      <p className="text-white/60">Cargando configuraciÃ³n de marca...</p>
    </motion.div>
  )
}
