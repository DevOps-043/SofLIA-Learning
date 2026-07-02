'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import type { CircuitBreakerSnapshotView } from './types'

interface CircuitBreakerCardsProps {
  circuitBreakers: CircuitBreakerSnapshotView[]
}

const STATE_PILL_CLASS: Record<CircuitBreakerSnapshotView['state'], string> = {
  closed: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10',
  'half-open': 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/10',
  open: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/10',
}

export function CircuitBreakerCards({ circuitBreakers }: CircuitBreakerCardsProps) {
  const { t } = useTranslation('admin')

  if (circuitBreakers.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('systemStatus.circuitBreaker.empty')}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {circuitBreakers.map((breaker) => (
        <div
          key={breaker.name}
          className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-800"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {breaker.name}
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                STATE_PILL_CLASS[breaker.state],
              )}
            >
              {breaker.state}
            </span>
          </div>

          <dl className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <dt>{t('systemStatus.circuitBreaker.failureRate')}</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {breaker.failureRate.toFixed(1)}% ({breaker.failures}/{breaker.total})
              </dd>
            </div>
            {breaker.nextAttemptAt && (
              <div className="flex justify-between">
                <dt>{t('systemStatus.circuitBreaker.nextAttempt')}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {new Date(breaker.nextAttemptAt).toLocaleTimeString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      ))}
    </div>
  )
}
