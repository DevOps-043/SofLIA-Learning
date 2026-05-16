'use client'

import { motion } from 'framer-motion'
import { AdminCreateCompanyGeneralSections } from './AdminCreateCompanyGeneralSections'
import type { CreateCompanyData, PlanOption } from './types'

interface AdminCreateCompanyGeneralTabProps {
  formData: CreateCompanyData
  isPlanOpen: boolean
  selectedPlan: PlanOption
  onNameChange: (name: string) => void
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onPlanOpenChange: (value: boolean) => void
}

export function AdminCreateCompanyGeneralTab(props: AdminCreateCompanyGeneralTabProps) {
  return (
    <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-8">
      <AdminCreateCompanyGeneralSections formData={props.formData} isPlanOpen={props.isPlanOpen} selectedPlan={props.selectedPlan} onNameChange={props.onNameChange} onFormDataChange={props.onFormDataChange} onPlanOpenChange={props.onPlanOpenChange} />
    </motion.div>
  )
}
