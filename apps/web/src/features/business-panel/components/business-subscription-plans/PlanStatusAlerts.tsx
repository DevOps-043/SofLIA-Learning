'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { BusinessPlansTheme } from './business-subscription-plans.types'

type PlanStatusAlertsProps = {
  changeError: string | null
  changeSuccess: boolean
  dangerSurface: string
  successSurface: string
  theme: BusinessPlansTheme
}

export function PlanStatusAlerts({
  changeError,
  changeSuccess,
  dangerSurface,
  successSurface,
  theme,
}: PlanStatusAlertsProps) {
  return (
    <AnimatePresence>
      {changeSuccess ? (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center gap-2.5 rounded-lg border p-3" style={{ backgroundColor: successSurface, borderColor: theme.successColor }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: theme.successColor }} />
          <span className="text-sm font-medium" style={{ color: theme.successColor }}>Plan actualizado exitosamente</span>
        </motion.div>
      ) : null}
      {changeError ? (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center gap-2.5 rounded-lg border p-3" style={{ backgroundColor: dangerSurface, borderColor: theme.dangerColor }}>
          <AlertCircle className="h-4 w-4" style={{ color: theme.dangerColor }} />
          <span className="text-sm font-medium" style={{ color: theme.dangerColor }}>{changeError}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
