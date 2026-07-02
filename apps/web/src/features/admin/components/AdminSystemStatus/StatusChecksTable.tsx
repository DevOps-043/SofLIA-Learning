'use client'

import { useTranslation } from 'react-i18next'

import { ServiceStatus } from '@aprende-y-aplica/shared'

import { cn } from '@/utils/cn'
import type { AdminStatusCheck } from './types'

interface StatusChecksTableProps {
  checks: AdminStatusCheck[]
}

const STATUS_PILL_CLASS: Record<ServiceStatus, string> = {
  [ServiceStatus.OPERATIONAL]:
    'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10',
  [ServiceStatus.DEGRADED]:
    'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/10',
  [ServiceStatus.DOWN]:
    'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/10',
}

export function StatusChecksTable({ checks }: StatusChecksTableProps) {
  const { t } = useTranslation('admin')

  if (checks.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('systemStatus.checksTable.empty')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.component')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.status')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.latency')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.classification')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.detail')}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
              {t('systemStatus.checksTable.checkedAt')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
          {checks.map((check) => (
            <tr key={check.id}>
              <td className="whitespace-nowrap px-4 py-2 text-gray-900 dark:text-white">
                {t(`systemStatus.components.${check.componentKey}`)}
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    STATUS_PILL_CLASS[check.status],
                  )}
                >
                  {t(`systemStatus.status.${check.status}`)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-400">
                {check.latencyMs} ms
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-400">
                {t(`systemStatus.errorClassification.${check.errorClassification}`)}
              </td>
              <td className="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-400" title={check.errorDetail ?? undefined}>
                {check.errorDetail ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-400">
                {new Date(check.checkedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
