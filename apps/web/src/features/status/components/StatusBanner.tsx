'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import { ServiceStatus } from '../types'

interface StatusBannerProps {
  overallStatus: ServiceStatus
}

const BANNER_CLASS: Record<ServiceStatus, string> = {
  [ServiceStatus.OPERATIONAL]: 'bg-[var(--color-success)]',
  [ServiceStatus.DEGRADED]: 'bg-[var(--color-warning)]',
  [ServiceStatus.DOWN]: 'bg-[var(--color-error)]',
}

export function StatusBanner({ overallStatus }: StatusBannerProps) {
  const { t } = useTranslation('common')

  return (
    <div
      className={cn(
        'rounded-xl px-6 py-5 text-lg font-semibold text-white shadow-sm',
        BANNER_CLASS[overallStatus],
      )}
      role="status"
    >
      {t(`status.banner.${overallStatus}`)}
    </div>
  )
}
