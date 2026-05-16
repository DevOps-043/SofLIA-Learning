'use client'

import { motion } from 'framer-motion'
import { AdminCreateCompanyOwnerCard } from './AdminCreateCompanyOwnerCard'
import { AdminCreateCompanyOwnerIntro } from './AdminCreateCompanyOwnerIntro'
import { AdminCreateCompanyOwnerNextSteps } from './AdminCreateCompanyOwnerNextSteps'
import type { CreateCompanyData } from './types'

interface AdminCreateCompanyOwnerTabProps {
  accentColor: string
  formData: CreateCompanyData
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
}

export function AdminCreateCompanyOwnerTab({
  accentColor,
  formData,
  onFormDataChange,
}: AdminCreateCompanyOwnerTabProps) {
  return (
    <motion.div
      key="owner"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl space-y-6"
    >
      <AdminCreateCompanyOwnerIntro />
      <AdminCreateCompanyOwnerCard
        accentColor={accentColor}
        formData={formData}
        onFormDataChange={onFormDataChange}
      />
      <AdminCreateCompanyOwnerNextSteps />
    </motion.div>
  )
}
