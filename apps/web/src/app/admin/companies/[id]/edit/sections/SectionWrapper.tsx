'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function SectionWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}
