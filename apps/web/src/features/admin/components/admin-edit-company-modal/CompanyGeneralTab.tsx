'use client'

import type { Dispatch, SetStateAction } from 'react'
import { motion } from 'framer-motion'
import { CompanyGeneralSections } from './CompanyGeneralSections'
import { type CompanyFormData } from './company-form.constants'

interface CompanyGeneralTabProps {
  formData: CompanyFormData
  isPlanOpen: boolean
  setIsPlanOpen: (open: boolean) => void
  setFormData: Dispatch<SetStateAction<CompanyFormData>>
}

export function CompanyGeneralTab(props: CompanyGeneralTabProps) {
  return (
    <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-8">
      <CompanyGeneralSections formData={props.formData} isPlanOpen={props.isPlanOpen} setIsPlanOpen={props.setIsPlanOpen} setFormData={props.setFormData} />
    </motion.div>
  )
}
