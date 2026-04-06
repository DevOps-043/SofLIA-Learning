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
  CheckCircle2,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  priceYearly: number
  priceMonthly: number
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
    case 'team': return <Users className="w-6 h-6" />
    case 'business': return <Building2 className="w-6 h-6" />
    case 'enterprise': return <Crown className="w-6 h-6" />
    default: return <Sparkles className="w-6 h-6" />
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
  handleSelectPlan,
}: PlanCardProps) {
  const savings = calculateYearlySavings(plan)
  const monthlyEquivalent =
    billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
  const currentPlanNormalized = currentPlan?.toLowerCase()
  const planIdNormalized = plan.id.toLowerCase()
  const isCurrentPlan =
    currentPlanNormalized === planIdNormalized &&
    (currentBillingCycle === billingCycle || !currentBillingCycle)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-xl border overflow-hidden transition-all flex flex-col h-full ${
        plan.isPopular
          ? 'border-[#0A2540] dark:border-[#00D4B3] shadow-lg scale-[1.02]'
          : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50'
      } ${isCurrentPlan ? 'ring-2 ring-[#10B981] ring-offset-2 dark:ring-offset-[#0F1419]' : ''}`}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: index * 0.1 + 0.2 }}
          className="absolute top-0 right-0 bg-[#0A2540] dark:bg-[#00D4B3] text-white px-3 py-1 rounded-bl-lg text-xs font-semibold z-10 flex items-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          {plan.badge || 'Más Popular'}
        </motion.div>
      )}

      {/* Badge de descuento */}
      {plan.badge && !plan.isPopular && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 bg-[#10B981] text-white px-2.5 py-1 rounded-full text-xs font-semibold z-10"
        >
          {plan.badge}
        </motion.div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-0 left-0 bg-[#10B981] text-white px-3 py-1 rounded-br-lg text-xs font-semibold z-10"
        >
          Plan Actual
        </motion.div>
      )}

      {/* Header */}
      <div className={`${getPlanColor(plan.id)} p-5 text-white flex-shrink-0`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-1.5 bg-white/20 rounded-lg">{getPlanIcon(plan.id)}</div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        <p className="text-white/90 text-xs mb-3 min-h-[16px]">{plan.tagline}</p>
        <div className="flex items-baseline gap-1.5">
          {plan.price === 'Personalizado' ? (
            <span className="text-2xl font-bold">Personalizado</span>
          ) : (
            <>
              <span className="text-3xl font-bold">
                ${billingCycle === 'yearly'
                  ? plan.priceYearly.toLocaleString('es-MX')
                  : plan.priceMonthly.toLocaleString('es-MX')}
              </span>
              <span className="text-white/80 text-sm">
                /{billingCycle === 'yearly' ? 'año' : 'mes'}
              </span>
            </>
          )}
        </div>
        <div className="min-h-[32px] mt-2">
          {plan.price !== 'Personalizado' && billingCycle === 'yearly' && savings > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/90 text-xs font-medium"
            >
              Ahorra {savings}% vs plan mensual
            </motion.p>
          )}
          {plan.price !== 'Personalizado' && billingCycle === 'yearly' && (
            <p className="text-white/80 text-xs mt-1">
              ${monthlyEquivalent.toLocaleString('es-MX')}/mes facturado anualmente
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="p-5 bg-white dark:bg-[#1E2329] flex flex-col flex-1">
        <ul className="space-y-2.5 mb-4 flex-1">
          {plan.features.map((feature, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + idx * 0.03 }}
              className="flex items-start gap-2.5"
            >
              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span className="text-xs text-[#0A2540] dark:text-gray-300 leading-relaxed">{feature}</span>
            </motion.li>
          ))}
        </ul>

        <button
          onClick={() => !isCurrentPlan && !planLoading && !isChangingPlan && handleSelectPlan(plan.id)}
          disabled={isCurrentPlan || planLoading || isChangingPlan}
          className={`w-full py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
            isCurrentPlan
              ? 'bg-[#10B981] text-white cursor-not-allowed'
              : plan.isPopular
              ? 'bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white'
              : plan.id === 'enterprise'
              ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white'
              : 'bg-[#E9ECEF] dark:bg-[#0A2540]/20 hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/30 text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30'
          }`}
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
              {currentPlan && currentPlanNormalized !== planIdNormalized
                ? 'Cambiar de plan'
                : 'Seleccionar plan'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
