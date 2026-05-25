'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle } from 'lucide-react'
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures'
import type { FeatureKey } from '@/lib/subscription/subscriptionFeatures'

interface FeatureLockProps {
  feature: FeatureKey
  children: ReactNode
  disabledClassName?: string
  showMessage?: boolean
  customMessage?: string
}

/**
 * Componente que bloquea contenido cuando una característica no está disponible en el plan actual
 * Muestra un overlay con mensaje explicativo cuando la característica no está disponible
 */
export function FeatureLock({
  feature,
  children,
  disabledClassName = '',
  showMessage = true,
  customMessage,
}: FeatureLockProps) {
  const { canUse, getMessage, loading } = useSubscriptionFeatures()

  if (loading) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const hasAccess = canUse(feature)
  const message = customMessage || getMessage(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className={`opacity-50 pointer-events-none select-none ${disabledClassName}`}>
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm rounded-lg"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.9)'
        }}
      >
        <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-primary" />
          </motion.div>

          <div className="space-y-2">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: 'var(--org-text-color, var(--color-bg-light))' }}
            >
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Función No Disponible
            </h3>
            {showMessage && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--org-text-color, var(--color-gray-400))', opacity: 0.8 }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
