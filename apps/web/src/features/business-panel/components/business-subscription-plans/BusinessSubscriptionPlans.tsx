'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Info,
  Loader2,
  Mail,
  Phone,
  TrendingUp,
  X,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { useBusinessSubscriptionPlansLogic } from '../../hooks/useBusinessSubscriptionPlansLogic'
import { formatPlanPrice, type BusinessPlanId } from '../../services/subscription.utils'
import { PlanCard } from './PlanCard'

export function BusinessSubscriptionPlans() {
  const theme = useBusinessPanelTheme()
  const {
    currentPlan,
    currentBillingCycle,
    subscription,
    planLoading,
    billingCycle,
    setBillingCycle,
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

  const successSurface = theme.isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)'
  const dangerSurface = theme.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'
  const warningSurface = theme.isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)'
  const primarySurface = theme.isDark ? 'rgba(0, 212, 179, 0.14)' : 'rgba(10, 37, 64, 0.08)'
  const modalShadow = theme.isDark
    ? '0 32px 80px rgba(0, 0, 0, 0.35)'
    : '0 32px 80px rgba(15, 23, 42, 0.18)'

  return (
    <div className="w-full space-y-12">
      <AnimatePresence>
        {changeSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2.5 rounded-lg border p-3"
            style={{
              backgroundColor: successSurface,
              borderColor: theme.successColor,
            }}
          >
            <CheckCircle2 className="h-4 w-4" style={{ color: theme.successColor }} />
            <span className="text-sm font-medium" style={{ color: theme.successColor }}>
              Plan actualizado exitosamente
            </span>
          </motion.div>
        )}

        {changeError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2.5 rounded-lg border p-3"
            style={{
              backgroundColor: dangerSurface,
              borderColor: theme.dangerColor,
            }}
          >
            <AlertCircle className="h-4 w-4" style={{ color: theme.dangerColor }} />
            <span className="text-sm font-medium" style={{ color: theme.dangerColor }}>
              {changeError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {currentPlan && (
        <div
          className="flex items-center justify-between rounded-lg border p-4"
          style={{
            backgroundColor: theme.hoverBg,
            borderColor: theme.borderColor,
          }}
        >
          <div>
            <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>
              Plan actual
            </p>
            <p className="text-base font-semibold capitalize" style={{ color: theme.textColor }}>
              {currentPlan} {currentBillingCycle === 'yearly' ? '(Anual)' : '(Mensual)'}
            </p>
          </div>

          {subscription?.end_date && (
            <div className="text-right">
              <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>
                Proxima renovacion
              </p>
              <p className="text-xs font-medium" style={{ color: theme.textColor }}>
                {new Date(subscription.end_date).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 flex items-center justify-center gap-3">
        <div
          className="inline-flex rounded-lg border p-1"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          <motion.button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className="relative rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: billingCycle === 'monthly' ? theme.textColor : theme.subtextColor,
            }}
          >
            {billingCycle === 'monthly' && (
              <motion.div
                layoutId="businessBillingCycle"
                className="absolute inset-0 rounded-md border shadow-sm"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Mensual</span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className="relative rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: billingCycle === 'yearly' ? theme.textColor : theme.subtextColor,
            }}
          >
            {billingCycle === 'yearly' && (
              <motion.div
                layoutId="businessBillingCycle"
                className="absolute inset-0 rounded-md border shadow-sm"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              Anual
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: billingCycle === 'yearly' ? 1 : 0 }}
                className="inline-block rounded-full px-1.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: successSurface,
                  color: theme.successColor,
                }}
              >
                Ahorra ~20%
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={index}
            billingCycle={billingCycle}
            currentPlan={currentPlan}
            currentBillingCycle={currentBillingCycle}
            planLoading={planLoading}
            isChangingPlan={isChangingPlan}
            getPlanColor={getPlanColor}
            calculateYearlySavings={calculateYearlySavings}
            handleSelectPlan={handleSelectPlan}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2
          className="mb-4 text-center text-xl font-bold"
          style={{ color: theme.textColor }}
        >
          Comparacion detallada de caracteristicas
        </h2>

        <div className="space-y-4">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div
              key={category}
              className="overflow-hidden rounded-xl border shadow-sm"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="border-b px-4 py-3"
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.dividerColor,
                }}
              >
                <h3
                  className="flex items-center gap-2 text-base font-bold"
                  style={{ color: theme.textColor }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  {category}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className="border-b"
                    style={{
                      backgroundColor: theme.hoverBg,
                      borderColor: theme.dividerColor,
                    }}
                  >
                    <tr>
                      <th
                        className="w-1/2 px-4 py-3 text-left text-xs font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        Caracteristica
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        Team
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        Business
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        Enterprise
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className="divide-y"
                    style={{ borderColor: theme.dividerColor }}
                  >
                    {features.map((feature, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors"
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = theme.hoverBg
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p
                              className="text-xs font-medium"
                              style={{ color: theme.textColor }}
                            >
                              {feature.name}
                            </p>
                            <p
                              className="mt-0.5 text-xs"
                              style={{ color: theme.subtextColor }}
                            >
                              {feature.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.team ? (
                            <Check className="mx-auto h-5 w-5" style={{ color: theme.successColor }} />
                          ) : (
                            <X className="mx-auto h-5 w-5" style={{ color: theme.mutedTextColor }} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.business ? (
                            <Check className="mx-auto h-5 w-5" style={{ color: theme.successColor }} />
                          ) : (
                            <X className="mx-auto h-5 w-5" style={{ color: theme.mutedTextColor }} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.enterprise ? (
                            <Check className="mx-auto h-5 w-5" style={{ color: theme.successColor }} />
                          ) : (
                            <X className="mx-auto h-5 w-5" style={{ color: theme.mutedTextColor }} />
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

      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: theme.subtextColor }}>
          Todas las suscripciones incluyen cancelacion en cualquier momento. Sin cargos ocultos.
        </p>
      </div>

      <AnimatePresence>
        {selectedPlan && selectedPlan !== 'enterprise' && changeInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelChange}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: theme.overlayBg }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-lg rounded-xl border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                boxShadow: modalShadow,
              }}
            >
              <div
                className="flex items-center justify-between border-b p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.dividerColor,
                }}
              >
                <h2
                  className="flex items-center gap-2.5 text-xl font-bold"
                  style={{ color: theme.textColor }}
                >
                  <div
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: primarySurface }}
                  >
                    <Info className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  </div>
                  Confirmar cambio de plan
                </h2>

                <button
                  type="button"
                  onClick={handleCancelChange}
                  disabled={isChangingPlan}
                  className="rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X className="h-4 w-4" style={{ color: theme.subtextColor }} />
                </button>
              </div>

              <div className="space-y-4 p-5" style={{ backgroundColor: theme.cardBg }}>
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>
                        Plan actual
                      </p>
                      <p className="text-base font-semibold" style={{ color: theme.textColor }}>
                        {changeInfo.currentPlan}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>
                        {changeInfo.currentPrice > 0 && changeInfo.currentPlanId
                          ? formatPlanPrice(
                            changeInfo.currentPlanId.toLowerCase() as BusinessPlanId,
                            changeInfo.currentBillingCycle,
                          )
                          : 'Sin plan activo'}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4" style={{ color: theme.subtextColor }} />

                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.subtextColor }}>
                        Plan nuevo
                      </p>
                      <p className="text-base font-semibold" style={{ color: theme.textColor }}>
                        {changeInfo.newPlan}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>
                        {formatPlanPrice(
                          changeInfo.newPlanId.toLowerCase() as BusinessPlanId,
                          changeInfo.newBillingCycle,
                        )}
                      </p>
                    </div>
                  </div>

                  <div
                    className="space-y-2 rounded-lg border p-3"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: theme.subtextColor }}>
                        Ciclo de facturacion:
                      </span>
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: theme.textColor }}
                      >
                        {changeInfo.newBillingCycle}
                      </span>
                    </div>

                    {changeInfo.priceDifference !== 0 && (
                      <div
                        className="flex items-center justify-between border-t pt-2"
                        style={{ borderColor: theme.dividerColor }}
                      >
                        <span className="text-xs" style={{ color: theme.subtextColor }}>
                          {changeInfo.priceDifference > 0 ? 'Aumento' : 'Disminucion'} de precio:
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: changeInfo.priceDifference > 0
                              ? theme.dangerColor
                              : theme.successColor,
                          }}
                        >
                          {changeInfo.priceDifference > 0 ? '+' : ''}$
                          {Math.abs(changeInfo.priceDifference).toLocaleString('es-MX')}/
                          {changeInfo.newBillingCycle === 'yearly' ? 'ano' : 'mes'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="rounded-lg border p-3"
                  style={{
                    backgroundColor: primarySurface,
                    borderColor: theme.primaryColor,
                  }}
                >
                  <p
                    className="flex items-start gap-2 text-xs"
                    style={{ color: theme.primaryColor }}
                  >
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      El cambio de plan sera efectivo inmediatamente. Tu proxima
                      facturacion reflejara el nuevo plan seleccionado.
                    </span>
                  </p>
                </div>

                {changeError && (
                  <div
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: dangerSurface,
                      borderColor: theme.dangerColor,
                    }}
                  >
                    <p
                      className="flex items-start gap-2 text-xs"
                      style={{ color: theme.dangerColor }}
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>{changeError}</span>
                    </p>
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-end gap-2.5 border-t p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.dividerColor,
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelChange}
                  disabled={isChangingPlan}
                  className="rounded-md px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: theme.hoverBg,
                    color: theme.subtextColor,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmChange}
                  disabled={isChangingPlan}
                  className="flex items-center gap-2 rounded-md px-5 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.onPrimaryColor,
                  }}
                >
                  {isChangingPlan ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      Confirmar cambio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedPlan === 'enterprise' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: theme.overlayBg }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-lg rounded-xl border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                boxShadow: modalShadow,
              }}
            >
              <div
                className="flex items-center justify-between border-b p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.dividerColor,
                }}
              >
                <h2
                  className="flex items-center gap-2.5 text-xl font-bold"
                  style={{ color: theme.textColor }}
                >
                  <div
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: warningSurface }}
                  >
                    <Crown className="h-4 w-4" style={{ color: theme.warningColor }} />
                  </div>
                  Plan Enterprise
                </h2>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-lg p-1.5 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X className="h-4 w-4" style={{ color: theme.subtextColor }} />
                </button>
              </div>

              <div className="space-y-3 p-5" style={{ backgroundColor: theme.cardBg }}>
                <p className="text-sm" style={{ color: theme.subtextColor }}>
                  El plan Enterprise es personalizado para grandes organizaciones.
                  Contacta con nuestro equipo de ventas para conocer mas detalles
                  y obtener una cotizacion personalizada.
                </p>

                <div className="space-y-2">
                  <a
                    href="mailto:ventas@aprendeyaplica.com"
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = theme.hoverBg
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = theme.inputBg
                    }}
                  >
                    <div
                      className="rounded-lg p-1.5"
                      style={{ backgroundColor: primarySurface }}
                    >
                      <Mail className="h-4 w-4" style={{ color: theme.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: theme.textColor }}>
                        Email
                      </p>
                      <p className="text-xs" style={{ color: theme.subtextColor }}>
                        ventas@aprendeyaplica.com
                      </p>
                    </div>
                  </a>

                  <a
                    href="tel:+525555555555"
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = theme.hoverBg
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = theme.inputBg
                    }}
                  >
                    <div
                      className="rounded-lg p-1.5"
                      style={{ backgroundColor: primarySurface }}
                    >
                      <Phone className="h-4 w-4" style={{ color: theme.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: theme.textColor }}>
                        Telefono
                      </p>
                      <p className="text-xs" style={{ color: theme.subtextColor }}>
                        +52 55 5555 5555
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-2.5 border-t p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.dividerColor,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-md px-4 py-2 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: theme.hoverBg,
                    color: theme.subtextColor,
                  }}
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
