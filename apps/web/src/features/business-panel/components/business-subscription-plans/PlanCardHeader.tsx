'use client'

import { motion } from 'framer-motion'
import type { BusinessPlansTheme } from './business-subscription-plans.types'
import { PlanCardIcon } from './PlanCardIcon'
import type { BusinessSubscriptionPlanCard } from './plan-card.types'

type PlanCardHeaderProps = {
  billingCycle: 'monthly' | 'yearly'
  headerColor: string
  monthlyEquivalent: number
  plan: BusinessSubscriptionPlanCard
  savings: number
  theme: BusinessPlansTheme
}

export function PlanCardHeader({ billingCycle, headerColor, monthlyEquivalent, plan, savings, theme }: PlanCardHeaderProps) {
  return (
    <div className="flex-shrink-0 p-5" style={{ backgroundColor: headerColor, color: theme.onPrimaryColor }}>
      <div className="mb-2 flex items-center gap-2.5"><div className="rounded-lg p-1.5" style={{ backgroundColor: `${theme.onPrimaryColor}20` }}><PlanCardIcon planId={plan.id} /></div><h3 className="text-xl font-bold">{plan.name}</h3></div>
      <p className="mb-3 min-h-[16px] text-xs" style={{ color: `${theme.onPrimaryColor}E6` }}>{plan.tagline}</p>
      <div className="flex items-baseline gap-1.5">
        {plan.price === 'Personalizado' ? <span className="text-2xl font-bold">Personalizado</span> : <><span className="text-3xl font-bold">${billingCycle === 'yearly' ? plan.priceYearly.toLocaleString('es-MX') : plan.priceMonthly.toLocaleString('es-MX')}</span><span className="text-sm" style={{ color: `${theme.onPrimaryColor}CC` }}>/{billingCycle === 'yearly' ? 'ano' : 'mes'}</span></>}
      </div>
      <div className="mt-2 min-h-[32px]">
        {plan.price !== 'Personalizado' && billingCycle === 'yearly' && savings > 0 ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium" style={{ color: `${theme.onPrimaryColor}E6` }}>Ahorra {savings}% vs plan mensual</motion.p> : null}
        {plan.price !== 'Personalizado' && billingCycle === 'yearly' ? <p className="mt-1 text-xs" style={{ color: `${theme.onPrimaryColor}CC` }}>${monthlyEquivalent.toLocaleString('es-MX')}/mes facturado anualmente</p> : null}
      </div>
    </div>
  )
}
