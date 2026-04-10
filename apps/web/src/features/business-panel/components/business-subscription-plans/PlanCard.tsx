'use client'

import { motion } from 'framer-motion'
import {
  Check,
  ArrowRight,
  Crown,
  Building2,
  Users,
  Sparkles,
  Star,
  Mail,
  CheckCircle2
} from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  priceYearly: number
  priceMonthly: number
  yearlyPrice: string
  monthlyPrice: string
  features: string[]
  isPopular?: boolean
  badge?: string
}

interface PlanCardProps {
  plan: Plan
  index: number
  billingCycle: 'monthly' | 'yearly'
  currentPlan: string | null | undefined
  currentBillingCycle: string | null | undefined
  planLoading: boolean
  isChangingPlan: boolean
  getPlanColor: (planId: string) => string
  calculateYearlySavings: (plan: Plan) => number
  handleSelectPlan: (planId: string) => void
}

function getPlanIcon(planId: string) {
  switch (planId) {
    case 'team':
      return <Users className="w-6 h-6" />
    case 'business':
      return <Building2 className="w-6 h-6" />
    case 'enterprise':
      return <Crown className="w-6 h-6" />
    default:
      return <Sparkles className="w-6 h-6" />
  }
}

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
  handleSelectPlan
}: PlanCardProps) {
  const theme = useBusinessPanelTheme()
  const headerColor = getPlanColor(plan.id)
  const savings = calculateYearlySavings(plan)
  const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
  const currentPlanNormalized = currentPlan?.toLowerCase()
  const planIdNormalized = plan.id.toLowerCase()
  const isCurrentPlan =
    currentPlanNormalized === planIdNormalized &&
    (currentBillingCycle === billingCycle || !currentBillingCycle)

  const cardBorderColor = plan.isPopular ? headerColor : theme.borderColor
  const actionBg = plan.isPopular
    ? theme.primaryColor
    : plan.id === 'enterprise'
      ? theme.warningColor
      : theme.inputBg
  const actionTextColor = plan.isPopular || plan.id === 'enterprise' || isCurrentPlan
    ? theme.onPrimaryColor
    : theme.textColor

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-xl border overflow-hidden transition-all flex flex-col h-full"
      style={{
        borderColor: isCurrentPlan ? theme.successColor : cardBorderColor,
        backgroundColor: theme.cardBg,
        boxShadow: plan.isPopular
          ? `0 24px 48px -28px ${headerColor}`
          : isCurrentPlan
            ? `0 0 0 2px ${theme.successColor}40`
            : 'none',
        transform: plan.isPopular ? 'scale(1.02)' : 'none'
      }}
    >
      {plan.isPopular ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: index * 0.1 + 0.2 }}
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-semibold z-10 flex items-center gap-1.5"
          style={{ backgroundColor: headerColor, color: theme.onPrimaryColor }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          {plan.badge || 'Mas Popular'}
        </motion.div>
      ) : null}

      {plan.badge && !plan.isPopular ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold z-10"
          style={{ backgroundColor: theme.successColor, color: theme.onPrimaryColor }}
        >
          {plan.badge}
        </motion.div>
      ) : null}

      {isCurrentPlan ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-0 left-0 px-3 py-1 rounded-br-lg text-xs font-semibold z-10"
          style={{ backgroundColor: theme.successColor, color: theme.onPrimaryColor }}
        >
          Plan Actual
        </motion.div>
      ) : null}

      <div className="p-5 flex-shrink-0" style={{ backgroundColor: headerColor, color: theme.onPrimaryColor }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${theme.onPrimaryColor}20` }}>
            {getPlanIcon(plan.id)}
          </div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        <p className="text-xs mb-3 min-h-[16px]" style={{ color: `${theme.onPrimaryColor}E6` }}>
          {plan.tagline}
        </p>
        <div className="flex items-baseline gap-1.5">
          {plan.price === 'Personalizado' ? (
            <span className="text-2xl font-bold">Personalizado</span>
          ) : (
            <>
              <span className="text-3xl font-bold">
                ${billingCycle === 'yearly' ? plan.priceYearly.toLocaleString('es-MX') : plan.priceMonthly.toLocaleString('es-MX')}
              </span>
              <span className="text-sm" style={{ color: `${theme.onPrimaryColor}CC` }}>
                /{billingCycle === 'yearly' ? 'ano' : 'mes'}
              </span>
            </>
          )}
        </div>
        <div className="min-h-[32px] mt-2">
          {plan.price !== 'Personalizado' && billingCycle === 'yearly' && savings > 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium" style={{ color: `${theme.onPrimaryColor}E6` }}>
              Ahorra {savings}% vs plan mensual
            </motion.p>
          ) : null}
          {plan.price !== 'Personalizado' && billingCycle === 'yearly' ? (
            <p className="text-xs mt-1" style={{ color: `${theme.onPrimaryColor}CC` }}>
              ${monthlyEquivalent.toLocaleString('es-MX')}/mes facturado anualmente
            </p>
          ) : null}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1" style={{ backgroundColor: theme.cardBg }}>
        <ul className="space-y-2.5 mb-4 flex-1">
          {plan.features.map((feature, featureIndex) => (
            <motion.li
              key={featureIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + featureIndex * 0.03 }}
              className="flex items-start gap-2.5"
            >
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.successColor }} />
              <span className="text-xs leading-relaxed" style={{ color: theme.textColor }}>{feature}</span>
            </motion.li>
          ))}
        </ul>

        <button
          onClick={() => !isCurrentPlan && !planLoading && !isChangingPlan && handleSelectPlan(plan.id)}
          disabled={isCurrentPlan || planLoading || isChangingPlan}
          className="w-full py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2 text-sm border"
          style={{
            backgroundColor: isCurrentPlan ? theme.successColor : actionBg,
            color: actionTextColor,
            borderColor: isCurrentPlan || plan.isPopular || plan.id === 'enterprise' ? 'transparent' : theme.borderColor
          }}
        >
          {isCurrentPlan ? (
            <>
              Plan Actual
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : plan.id === 'enterprise' ? (
            <>
              Contactar Ventas
              <Mail className="w-4 h-4" />
            </>
          ) : (
            <>
              {currentPlan && currentPlanNormalized !== planIdNormalized ? 'Cambiar de plan' : 'Seleccionar plan'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
