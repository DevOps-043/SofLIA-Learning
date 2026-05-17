'use client'

import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

export function PersonalizationEmptyState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
      <Info className="w-20 h-20 mx-auto mb-6 text-white/60" />
      <p className="text-white/80 text-lg">No hay informacion de organizacion disponible</p>
    </motion.div>
  )
}
