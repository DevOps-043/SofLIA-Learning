'use client'

import { AnimatePresence } from 'framer-motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { useBusinessSubscriptionPlansLogic } from '../../hooks/useBusinessSubscriptionPlansLogic'
import { BillingCycleToggle } from './BillingCycleToggle'
import { CurrentPlanSummary } from './CurrentPlanSummary'
import { EnterpriseContactModal } from './EnterpriseContactModal'
import { FeaturesComparison } from './FeaturesComparison'
import { PlanCard } from './PlanCard'
import { PlanChangeModal } from './PlanChangeModal'
import { PlanStatusAlerts } from './PlanStatusAlerts'

export function BusinessSubscriptionPlans() {
  const theme = useBusinessPanelTheme()
  const logic = useBusinessSubscriptionPlansLogic()
  const successSurface = theme.isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)'
  const dangerSurface = theme.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'
  const warningSurface = theme.isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)'
  const primarySurface = theme.isDark ? 'rgba(0, 212, 179, 0.14)' : 'rgba(10, 37, 64, 0.08)'
  const modalShadow = theme.isDark ? '0 32px 80px rgba(0, 0, 0, 0.35)' : '0 32px 80px rgba(15, 23, 42, 0.18)'

  return (
    <div className="w-full space-y-12">
      <PlanStatusAlerts changeError={logic.changeError} changeSuccess={logic.changeSuccess} dangerSurface={dangerSurface} successSurface={successSurface} theme={theme} />
      <CurrentPlanSummary currentBillingCycle={logic.currentBillingCycle} currentPlan={logic.currentPlan} subscription={logic.subscription} theme={theme} />
      <BillingCycleToggle billingCycle={logic.billingCycle} setBillingCycle={logic.setBillingCycle} successSurface={successSurface} theme={theme} />
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        {logic.plans.map((plan, index) => (
          <PlanCard key={plan.id} plan={plan} index={index} billingCycle={logic.billingCycle} currentPlan={logic.currentPlan} currentBillingCycle={logic.currentBillingCycle} planLoading={logic.planLoading} isChangingPlan={logic.isChangingPlan} getPlanColor={logic.getPlanColor} calculateYearlySavings={logic.calculateYearlySavings} handleSelectPlan={logic.handleSelectPlan} />
        ))}
      </div>
      <FeaturesComparison featuresByCategory={logic.featuresByCategory} theme={theme} />
      <div className="mt-6 text-center"><p className="text-xs" style={{ color: theme.subtextColor }}>Todas las suscripciones incluyen cancelacion en cualquier momento. Sin cargos ocultos.</p></div>
      <AnimatePresence>
        {logic.selectedPlan && logic.selectedPlan !== 'enterprise' && logic.changeInfo ? (
          <PlanChangeModal changeError={logic.changeError} changeInfo={logic.changeInfo} dangerSurface={dangerSurface} handleCancelChange={logic.handleCancelChange} handleConfirmChange={logic.handleConfirmChange} isChangingPlan={logic.isChangingPlan} modalShadow={modalShadow} primarySurface={primarySurface} theme={theme} />
        ) : null}
        {logic.selectedPlan === 'enterprise' ? (
          <EnterpriseContactModal modalShadow={modalShadow} primarySurface={primarySurface} setSelectedPlan={logic.setSelectedPlan} theme={theme} warningSurface={warningSurface} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
