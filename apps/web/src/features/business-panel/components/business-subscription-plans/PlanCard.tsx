'use client'

import { motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { PlanCardAction } from './PlanCardAction'
import { PlanCardBadges } from './PlanCardBadges'
import { PlanCardFeatureList } from './PlanCardFeatureList'
import { PlanCardHeader } from './PlanCardHeader'
import type { PlanCardProps } from './plan-card.types'

export function PlanCard({
  plan,
  index,
  billingCycle,
  currentPlan,
  currentBillingCycle,
  planLoading,
  isChangingPlan,
  getPlanColor,
  calculateYearlySavings,
  handleSelectPlan,
}: PlanCardProps) {
  const theme = useBusinessPanelTheme()
  const headerColor = getPlanColor(plan.id)
  const savings = calculateYearlySavings(plan)
  const currentPlanNormalized = currentPlan?.toLowerCase()
  const planIdNormalized = plan.id.toLowerCase()
  const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
  const isCurrentPlan = currentPlanNormalized === planIdNormalized && (currentBillingCycle === billingCycle || !currentBillingCycle)
  const cardBorderColor = plan.isPopular ? headerColor : theme.borderColor
  const actionBg = plan.isPopular ? theme.primaryColor : plan.id === 'enterprise' ? theme.warningColor : theme.inputBg
  const actionTextColor = plan.isPopular || plan.id === 'enterprise' || isCurrentPlan ? theme.onPrimaryColor : theme.textColor

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="relative flex h-full flex-col overflow-hidden rounded-xl border transition-all" style={{ borderColor: isCurrentPlan ? theme.successColor : cardBorderColor, backgroundColor: theme.cardBg, boxShadow: getPlanCardShadow(plan.isPopular, isCurrentPlan, headerColor, theme.successColor), transform: plan.isPopular ? 'scale(1.02)' : 'none' }}>
      <PlanCardBadges headerColor={headerColor} index={index} isCurrentPlan={isCurrentPlan} plan={plan} theme={theme} />
      <PlanCardHeader billingCycle={billingCycle} headerColor={headerColor} monthlyEquivalent={monthlyEquivalent} plan={plan} savings={savings} theme={theme} />
      <div className="flex flex-1 flex-col p-5" style={{ backgroundColor: theme.cardBg }}>
        <PlanCardFeatureList features={plan.features} index={index} theme={theme} />
        <PlanCardAction actionBg={actionBg} actionTextColor={actionTextColor} currentPlan={currentPlan} currentPlanNormalized={currentPlanNormalized} handleSelectPlan={handleSelectPlan} isChangingPlan={isChangingPlan} isCurrentPlan={isCurrentPlan} plan={plan} planIdNormalized={planIdNormalized} planLoading={planLoading} theme={theme} />
      </div>
    </motion.div>
  )
}

function getPlanCardShadow(isPopular: boolean | undefined, isCurrentPlan: boolean, headerColor: string, successColor: string) {
  if (isPopular) return `0 24px 48px -28px ${headerColor}`
  if (isCurrentPlan) return `0 0 0 2px ${successColor}40`
  return 'none'
}
