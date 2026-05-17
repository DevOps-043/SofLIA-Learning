'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { BusinessPlansTheme } from './business-subscription-plans.types'

type PlanCardFeatureListProps = { features: string[]; index: number; theme: BusinessPlansTheme }

export function PlanCardFeatureList({ features, index, theme }: PlanCardFeatureListProps) {
  return (
    <ul className="mb-4 flex-1 space-y-2.5">
      {features.map((feature, featureIndex) => (
        <motion.li key={featureIndex} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 + featureIndex * 0.03 }} className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: theme.successColor }} />
          <span className="text-xs leading-relaxed" style={{ color: theme.textColor }}>{feature}</span>
        </motion.li>
      ))}
    </ul>
  )
}
