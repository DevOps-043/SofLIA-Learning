'use client'

import type { BusinessPlansLogic, BusinessPlansTheme } from './business-subscription-plans.types'

type CurrentPlanSummaryProps = {
  currentBillingCycle: BusinessPlansLogic['currentBillingCycle']
  currentPlan: BusinessPlansLogic['currentPlan']
  subscription: BusinessPlansLogic['subscription']
  theme: BusinessPlansTheme
}

export function CurrentPlanSummary({ currentBillingCycle, currentPlan, subscription, theme }: CurrentPlanSummaryProps) {
  if (!currentPlan) return null

  return (
    <div className="flex items-center justify-between rounded-lg border p-4" style={{ backgroundColor: theme.hoverBg, borderColor: theme.borderColor }}>
      <div>
        <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>Plan actual</p>
        <p className="text-base font-semibold capitalize" style={{ color: theme.textColor }}>
          {currentPlan} {currentBillingCycle === 'yearly' ? '(Anual)' : '(Mensual)'}
        </p>
      </div>
      {subscription?.end_date ? (
        <div className="text-right">
          <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>Proxima renovacion</p>
          <p className="text-xs font-medium" style={{ color: theme.textColor }}>
            {new Date(subscription.end_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      ) : null}
    </div>
  )
}
