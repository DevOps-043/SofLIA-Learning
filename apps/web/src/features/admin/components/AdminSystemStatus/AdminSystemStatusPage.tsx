'use client'

import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { cn } from '@/utils/cn'
import { CircuitBreakerCards } from './CircuitBreakerCards'
import { LatencyChart } from './LatencyChart'
import { StatusChecksTable } from './StatusChecksTable'
import { useAdminSystemStatusLogic } from './hooks/useAdminSystemStatusLogic'

export function AdminSystemStatusPage() {
  const { t } = useTranslation('admin')
  const logic = useAdminSystemStatusLogic()

  const handleRunCheck = async (componentKey: StatusComponentKey) => {
    const { ok } = await logic.runCheck(componentKey)
    if (ok) {
      logic.showToast(t('systemStatus.runCheckSuccess'), 'success')
    } else {
      logic.showToast(t('systemStatus.runCheckError'), 'error')
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('systemStatus.title')}
            </h1>
            {logic.generatedAt && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {t('systemStatus.lastUpdated', {
                  time: new Date(logic.generatedAt).toLocaleTimeString(),
                })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.values(StatusComponentKey).map((componentKey) => (
              <button
                key={componentKey}
                type="button"
                disabled={logic.runningComponent !== null}
                onClick={() => handleRunCheck(componentKey)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 transition-colors',
                  'hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-white/10 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700',
                )}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    logic.runningComponent === componentKey && 'animate-spin',
                  )}
                />
                {t('systemStatus.runCheckNow')}: {t(`systemStatus.components.${componentKey}`)}
              </button>
            ))}
          </div>
        </header>

        {logic.error && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-800 dark:text-gray-400">
            {t('systemStatus.loadError')}
          </div>
        )}

        {logic.isLoading && (
          <div className="space-y-4" aria-hidden>
            <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
            <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
          </div>
        )}

        {!logic.isLoading && !logic.error && (
          <>
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('systemStatus.circuitBreaker.sectionTitle')}
              </h2>
              <CircuitBreakerCards circuitBreakers={logic.circuitBreakers} />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('systemStatus.latencySectionTitle')}
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Object.values(StatusComponentKey).map((componentKey) => (
                  <LatencyChart
                    key={componentKey}
                    checks={logic.checks}
                    componentKey={componentKey}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('systemStatus.checksTable.sectionTitle')}
              </h2>
              <StatusChecksTable checks={logic.checks} />
            </section>
          </>
        )}
      </div>

      <ToastNotification
        isOpen={logic.toast.isOpen}
        onClose={logic.hideToast}
        message={logic.toast.message}
        type={logic.toast.type}
        position="top-right"
      />
    </div>
  )
}
