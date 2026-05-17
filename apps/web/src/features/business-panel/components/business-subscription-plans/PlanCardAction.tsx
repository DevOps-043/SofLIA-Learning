'use client'

import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import type { BusinessPlansTheme } from './business-subscription-plans.types'
import type { BusinessSubscriptionPlanCard } from './plan-card.types'

type PlanCardActionProps = {
  actionBg: string
  actionTextColor: string
  currentPlan: string | null | undefined
  currentPlanNormalized: string | undefined
  handleSelectPlan: (planId: string) => void
  isChangingPlan: boolean
  isCurrentPlan: boolean
  plan: BusinessSubscriptionPlanCard
  planIdNormalized: string
  planLoading: boolean
  theme: BusinessPlansTheme
}

export function PlanCardAction(props: PlanCardActionProps) {
  const { actionBg, actionTextColor, currentPlan, currentPlanNormalized, handleSelectPlan, isChangingPlan, isCurrentPlan, plan, planIdNormalized, planLoading, theme } = props
  const isDisabled = isCurrentPlan || planLoading || isChangingPlan
  return (
    <button onClick={() => !isDisabled && handleSelectPlan(plan.id)} disabled={isDisabled} className="flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: isCurrentPlan ? theme.successColor : actionBg, color: actionTextColor, borderColor: isCurrentPlan || plan.isPopular || plan.id === 'enterprise' ? 'transparent' : theme.borderColor }}>
      {isCurrentPlan ? <PlanCardActionLabel label="Plan Actual" icon={<CheckCircle2 className="h-4 w-4" />} /> : null}
      {!isCurrentPlan && plan.id === 'enterprise' ? <PlanCardActionLabel label="Contactar Ventas" icon={<Mail className="h-4 w-4" />} /> : null}
      {!isCurrentPlan && plan.id !== 'enterprise' ? <PlanCardActionLabel label={currentPlan && currentPlanNormalized !== planIdNormalized ? 'Cambiar de plan' : 'Seleccionar plan'} icon={<ArrowRight className="h-4 w-4" />} /> : null}
    </button>
  )
}

function PlanCardActionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return <>{label}{icon}</>
}
