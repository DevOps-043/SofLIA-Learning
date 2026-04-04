'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  X,
  ArrowRight,
  Crown,
  Building2,
  Users,
  Sparkles,
  Star,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react'
import { useBusinessSubscriptionPlansLogic } from '../hooks/useBusinessSubscriptionPlansLogic'
import { formatPlanPrice, type BusinessPlanId } from '../services/subscription.utils'

export function BusinessSubscriptionPlans() {
  const {
    currentPlan,
    currentBillingCycle,
    subscription,
    planLoading,
    billingCycle, setBillingCycle,
    selectedPlan,
    setSelectedPlan,
    isChangingPlan,
    changeError,
    changeSuccess,
    plans,
    featuresByCategory,
    changeInfo,
    handleSelectPlan,
    handleConfirmChange,
    handleCancelChange,
    getPlanColor,
    calculateYearlySavings,
  } = useBusinessSubscriptionPlansLogic()

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'team': return <Users className="w-6 h-6" />
      case 'business': return <Building2 className="w-6 h-6" />
      case 'enterprise': return <Crown className="w-6 h-6" />
      default: return <Sparkles className="w-6 h-6" />
    }
  }

  return (
    <div className="w-full space-y-12">
      {/* Mensajes de éxito/error */}
      <AnimatePresence>
        {changeSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981] dark:border-[#10B981] rounded-lg p-3 flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span className="text-[#10B981] font-medium text-sm">
              Plan actualizado exitosamente
            </span>
          </motion.div>
        )}
        {changeError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 dark:bg-red-500/20 border border-red-500 dark:border-red-500 rounded-lg p-3 flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500 font-medium text-sm">
              {changeError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador del Plan Actual */}
      {currentPlan && (
        <div className="bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border border-[#0A2540]/20 dark:border-[#00D4B3]/20 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-1">Plan Actual</p>
            <p className="text-base font-semibold text-[#0A2540] dark:text-white capitalize">
              {currentPlan} {currentBillingCycle === 'yearly' ? '(Anual)' : '(Mensual)'}
            </p>
          </div>
          {subscription?.end_date && (
            <div className="text-right">
              <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-1">Próxima renovación</p>
              <p className="text-xs font-medium text-[#0A2540] dark:text-white">
                {new Date(subscription.end_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toggle de Facturación */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="inline-flex bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 rounded-lg p-1 border border-[#E9ECEF] dark:border-[#6C757D]/30">
          <motion.button
            onClick={() => setBillingCycle('monthly')}
            className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
              billingCycle === 'monthly'
                ? 'text-[#0A2540] dark:text-white'
                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
            }`}
          >
            {billingCycle === 'monthly' && (
              <motion.div
                layoutId="businessBillingCycle"
                className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Mensual</span>
          </motion.button>
          <motion.button
            onClick={() => setBillingCycle('yearly')}
            className={`relative px-4 py-2 font-medium transition-colors rounded-md text-sm ${
              billingCycle === 'yearly'
                ? 'text-[#0A2540] dark:text-white'
                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
            }`}
          >
            {billingCycle === 'yearly' && (
              <motion.div
                layoutId="businessBillingCycle"
                className="absolute inset-0 bg-white dark:bg-[#1E2329] rounded-md shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              Anual
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: billingCycle === 'yearly' ? 1 : 0 }}
                className="inline-block bg-[#10B981] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold"
              >
                Ahorra ~20%
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* Cards de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {plans.map((plan, index) => {
          const savings = calculateYearlySavings(plan);
          const monthlyEquivalent = billingCycle === 'yearly' 
            ? Math.round(plan.priceYearly / 12)
            : plan.priceMonthly;
          const currentPlanNormalized = currentPlan?.toLowerCase()
          const planIdNormalized = plan.id.toLowerCase()
          const isCurrentPlan = currentPlanNormalized === planIdNormalized && 
                               (currentBillingCycle === billingCycle || !currentBillingCycle)

          return (
            <motion.div
              key={plan.id}
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
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    {getPlanIcon(plan.id)}
                  </div>
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
                          : plan.priceMonthly.toLocaleString('es-MX')
                        }
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
                      {currentPlan && currentPlanNormalized !== planIdNormalized ? 'Cambiar de plan' : 'Seleccionar plan'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparación Detallada por Categorías */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#0A2540] dark:text-white mb-4 text-center">
          Comparación Detallada de Características
        </h2>
        <div className="space-y-4">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div
              key={category}
              className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm"
            >
              <div className="bg-[#0A2540]/5 dark:bg-[#0A2540]/10 px-4 py-3 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <h3 className="text-base font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                  {category}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A2540] dark:text-white w-1/2">
                        Característica
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#0A2540] dark:text-white">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#0A2540] dark:text-white">
                        Business
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#0A2540] dark:text-white">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                    {features.map((feature, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#E9ECEF]/30 dark:hover:bg-[#0A2540]/10 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-[#0A2540] dark:text-white font-medium text-xs">{feature.name}</p>
                            <p className="text-[#6C757D] dark:text-gray-400 text-xs mt-0.5">{feature.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.team ? (
                            <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-[#6C757D] dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.business ? (
                            <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-[#6C757D] dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.enterprise ? (
                            <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-[#6C757D] dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota de comparación */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#6C757D] dark:text-gray-400">
          Todas las suscripciones incluyen cancelación en cualquier momento. Sin cargos ocultos.
        </p>
      </div>

      {/* Modal de Confirmación de Cambio de Plan */}
      <AnimatePresence>
        {selectedPlan && selectedPlan !== 'enterprise' && changeInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelChange}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white dark:bg-[#1E2329] backdrop-blur-md rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 w-full max-w-lg z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <h2 className="text-xl font-bold text-[#0A2540] dark:text-white flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-lg">
                    <Info className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                  Confirmar Cambio de Plan
                </h2>
                <button
                  onClick={handleCancelChange}
                  disabled={isChangingPlan}
                  className="p-1.5 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 bg-white dark:bg-[#1E2329]">
                {/* Resumen del Cambio */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10">
                    <div>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-1">Plan Actual</p>
                      <p className="text-base font-semibold text-[#0A2540] dark:text-white">{changeInfo.currentPlan}</p>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-0.5">
                        {changeInfo.currentPrice > 0 && changeInfo.currentPlanId
                          ? formatPlanPrice(changeInfo.currentPlanId.toLowerCase() as BusinessPlanId, changeInfo.currentBillingCycle)
                          : 'Sin plan activo'
                        }
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#6C757D] dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-1">Plan Nuevo</p>
                      <p className="text-base font-semibold text-[#0A2540] dark:text-white">{changeInfo.newPlan}</p>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-0.5">
                        {formatPlanPrice(changeInfo.newPlanId.toLowerCase() as BusinessPlanId, changeInfo.newBillingCycle)}
                      </p>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="p-3 rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6C757D] dark:text-gray-400">Ciclo de facturación:</span>
                      <span className="text-xs font-medium text-[#0A2540] dark:text-white capitalize">{changeInfo.newBillingCycle}</span>
                    </div>
                    {changeInfo.priceDifference !== 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <span className="text-xs text-[#6C757D] dark:text-gray-400">
                          {changeInfo.priceDifference > 0 ? 'Aumento' : 'Disminución'} de precio:
                        </span>
                        <span className={`text-xs font-semibold ${changeInfo.priceDifference > 0 ? 'text-red-500' : 'text-[#10B981]'}`}>
                          {changeInfo.priceDifference > 0 ? '+' : ''}
                          ${Math.abs(changeInfo.priceDifference).toLocaleString('es-MX')}
                          /{changeInfo.newBillingCycle === 'yearly' ? 'año' : 'mes'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensaje informativo */}
                <div className="p-3 rounded-lg border border-[#0A2540]/20 dark:border-[#00D4B3]/30 bg-[#0A2540]/5 dark:bg-[#00D4B3]/10">
                  <p className="text-xs text-[#0A2540] dark:text-[#00D4B3] flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>El cambio de plan será efectivo inmediatamente. Tu próxima facturación reflejará el nuevo plan seleccionado.</span>
                  </p>
                </div>

                {/* Error */}
                {changeError && (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 dark:bg-red-500/20">
                    <p className="text-xs text-red-500 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{changeError}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 p-5 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <button
                  onClick={handleCancelChange}
                  disabled={isChangingPlan}
                  className="px-4 py-2 text-xs font-medium text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmChange}
                  disabled={isChangingPlan}
                  className="px-5 py-2 bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white rounded-md font-medium transition-colors flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isChangingPlan ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      Confirmar Cambio
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Enterprise - Contacto de Ventas */}
        {selectedPlan === 'enterprise' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white dark:bg-[#1E2329] backdrop-blur-md rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 w-full max-w-lg z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <h2 className="text-xl font-bold text-[#0A2540] dark:text-white flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#F59E0B]/10 rounded-lg">
                    <Crown className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  Plan Enterprise
                </h2>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-1.5 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3 bg-white dark:bg-[#1E2329]">
                <p className="text-sm text-[#6C757D] dark:text-gray-300">
                  El plan Enterprise es personalizado para grandes organizaciones. Por favor, contacta con nuestro equipo de ventas para conocer más detalles y obtener una cotización personalizada.
                </p>
                
                <div className="space-y-2">
                  <a
                    href="mailto:ventas@aprendeyaplica.com"
                    className="flex items-center gap-3 p-3 bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10 rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-colors"
                  >
                    <div className="p-1.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-lg">
                      <Mail className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#0A2540] dark:text-white">Email</p>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400">ventas@aprendeyaplica.com</p>
                    </div>
                  </a>
                  
                  <a
                    href="tel:+525555555555"
                    className="flex items-center gap-3 p-3 bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10 rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-colors"
                  >
                    <div className="p-1.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 rounded-lg">
                      <Phone className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#0A2540] dark:text-white">Teléfono</p>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400">+52 55 5555 5555</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 p-5 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-xs font-medium text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors rounded-md hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
