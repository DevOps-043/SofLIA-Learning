'use client'

import { motion } from 'framer-motion'
import { XCircle } from 'lucide-react'

interface BrandingErrorStateProps {
  error: string
}

export function BrandingErrorState({ error }: BrandingErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <XCircle className="w-20 h-20 mx-auto mb-6 text-red-400" />
      </motion.div>
      <p className="text-lg mb-4 text-red-300">{error}</p>
    </motion.div>
  )
}
