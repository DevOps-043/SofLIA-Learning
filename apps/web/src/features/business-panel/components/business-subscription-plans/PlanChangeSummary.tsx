'use client'

import { ArrowRight } from 'lucide-react'
import { formatPlanPrice, type BusinessPlanId } from '../../services/subscription.utils'
import type { BusinessPlansChangeInfo, BusinessPlansTheme } from './business-subscription-plans.types'

type PlanChangeSummaryProps = { changeInfo: BusinessPlansChangeInfo; theme: BusinessPlansTheme }

export function PlanChangeSummary({ changeInfo, theme }: PlanChangeSummaryProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <PlanPriceBlock label="Plan actual" name={changeInfo.currentPlan} price={changeInfo.currentPrice > 0 && changeInfo.currentPlanId ? formatPlanPrice(changeInfo.currentPlanId.toLowerCase() as BusinessPlanId, changeInfo.currentBillingCycle) : 'Sin plan activo'} theme={theme} />
      <ArrowRight className="h-4 w-4" style={{ color: theme.subtextColor }} />
      <PlanPriceBlock label="Plan nuevo" name={changeInfo.newPlan} price={formatPlanPrice(changeInfo.newPlanId.toLowerCase() as BusinessPlanId, changeInfo.newBillingCycle)} theme={theme} />
    </div>
  )
}

function PlanPriceBlock({ label, name, price, theme }: { label: string; name: string; price: string; theme: BusinessPlansTheme }) {
  return (
    <div>
      <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>{label}</p>
      <p className="text-base font-semibold" style={{ color: theme.textColor }}>{name}</p>
      <p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>{price}</p>
    </div>
  )
}
