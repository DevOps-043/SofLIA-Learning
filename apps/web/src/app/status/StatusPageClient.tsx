'use client'

import { useTranslation } from 'react-i18next'

import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { LandingHeader } from '@/features/landing/components/LandingHeader'
import { StatusBanner } from '@/features/status/components/StatusBanner'
import { StatusComponentRow } from '@/features/status/components/StatusComponentRow'
import { usePublicStatus } from '@/features/status/hooks/usePublicStatus'

export function StatusPageClient() {
  const { t } = useTranslation('common')
  const { status, error, isLoading } = usePublicStatus()

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 transition-colors duration-500 dark:bg-gray-900">
      <LandingHeader />

      <main className="px-4 pb-20 pt-32">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            {t('status.pageTitle')}
          </h1>

          {isLoading && (
            <div className="space-y-4" aria-hidden>
              <div className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
              <div className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
              <div className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
              <div className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
            </div>
          )}

          {!isLoading && (error || !status) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-800 dark:text-gray-400">
              {t('status.unavailable')}
            </div>
          )}

          {!isLoading && status && (
            <div className="space-y-4">
              <StatusBanner overallStatus={status.overallStatus} />

              {status.components.map((component) => (
                <StatusComponentRow
                  key={component.key}
                  component={component}
                  uptimeDays={status.uptimeDays[component.key] ?? []}
                />
              ))}

              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('status.lastUpdated', {
                  time: new Date(status.generatedAt).toLocaleTimeString(),
                })}
              </p>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
