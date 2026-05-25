'use client'

import { motion } from 'framer-motion'
import type { BillingCycleValue, BusinessPlansTheme, SelectBillingCycle } from './business-subscription-plans.types'

type BillingCycleToggleProps = {
  billingCycle: BillingCycleValue
  setBillingCycle: SelectBillingCycle
  successSurface: string
  theme: BusinessPlansTheme
}

const billingCycleOptions = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'yearly', label: 'Anual' },
] as const

export function BillingCycleToggle({ billingCycle, setBillingCycle, successSurface, theme }: BillingCycleToggleProps) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3">
      <div className="inline-flex rounded-lg border p-1" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        {billingCycleOptions.map((option) => (
          <motion.button key={option.id} type="button" onClick={() => setBillingCycle(option.id)} className="relative rounded-md px-4 py-2 text-sm font-medium transition-colors" style={{ color: billingCycle === option.id ? theme.textColor : theme.subtextColor }}>
            {billingCycle === option.id ? <motion.div layoutId="businessBillingCycle" className="absolute inset-0 rounded-md border shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} /> : null}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.label}
              {option.id === 'yearly' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: billingCycle === 'yearly' ? 1 : 0 }} className="inline-block rounded-full px-1.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: successSurface, color: theme.successColor }}>
                  Ahorra ~20%
                </motion.span>
              ) : null}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
