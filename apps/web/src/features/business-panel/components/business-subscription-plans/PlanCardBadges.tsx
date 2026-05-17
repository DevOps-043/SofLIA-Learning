'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { BusinessPlansTheme } from './business-subscription-plans.types'
import type { BusinessSubscriptionPlanCard } from './plan-card.types'

type PlanCardBadgesProps = {
  headerColor: string
  index: number
  isCurrentPlan: boolean
  plan: BusinessSubscriptionPlanCard
  theme: BusinessPlansTheme
}

export function PlanCardBadges({ headerColor, index, isCurrentPlan, plan, theme }: PlanCardBadgesProps) {
  return (
    <>
      {plan.isPopular ? (
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: index * 0.1 + 0.2 }} className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-bl-lg px-3 py-1 text-xs font-semibold" style={{ backgroundColor: headerColor, color: theme.onPrimaryColor }}>
          <Star className="h-3.5 w-3.5 fill-current" />{plan.badge || 'Mas Popular'}
        </motion.div>
      ) : null}
      {plan.badge && !plan.isPopular ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-4 z-10 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: theme.successColor, color: theme.onPrimaryColor }}>
          {plan.badge}
        </motion.div>
      ) : null}
      {isCurrentPlan ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-0 top-0 z-10 rounded-br-lg px-3 py-1 text-xs font-semibold" style={{ backgroundColor: theme.successColor, color: theme.onPrimaryColor }}>
          Plan Actual
        </motion.div>
      ) : null}
    </>
  )
}
