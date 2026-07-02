'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import {
  ServiceStatus,
  type DailyUptimeBucket,
  type PublicStatusComponent,
} from '../types'
import { UptimeBar } from './UptimeBar'

interface StatusComponentRowProps {
  component: PublicStatusComponent
  uptimeDays: DailyUptimeBucket[]
}

const PILL_CLASS: Record<ServiceStatus, string> = {
  [ServiceStatus.OPERATIONAL]:
    'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10',
  [ServiceStatus.DEGRADED]:
    'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/10',
  [ServiceStatus.DOWN]:
    'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/10',
}

export function StatusComponentRow({ component, uptimeDays }: StatusComponentRowProps) {
  const { t } = useTranslation('common')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t(`status.components.${component.key}`)}
        </h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            PILL_CLASS[component.status],
          )}
        >
          {t(`status.currentStatus.${component.status}`)}
        </span>
      </div>

      <UptimeBar days={uptimeDays} />

      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {t('status.uptimeBar.legend')}
      </p>
    </div>
  )
}
