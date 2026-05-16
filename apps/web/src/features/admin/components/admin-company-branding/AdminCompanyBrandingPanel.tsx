'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AdminCompanyBrandingPanelProps {
  children: ReactNode
}

export function AdminCompanyBrandingPanel({
  children,
}: AdminCompanyBrandingPanelProps) {
  return (
    <motion.div
      key="branding"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl space-y-8"
    >
      {children}
    </motion.div>
  )
}
