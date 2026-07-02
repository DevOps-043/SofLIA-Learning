'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import { ServiceStatus, type DailyUptimeBucket } from '../types'

interface UptimeBarProps {
  days: DailyUptimeBucket[]
  className?: string
}

const STATUS_CELL_CLASS: Record<DailyUptimeBucket['status'], string> = {
  [ServiceStatus.OPERATIONAL]: 'bg-[var(--color-success)]',
  [ServiceStatus.DEGRADED]: 'bg-[var(--color-warning)]',
  [ServiceStatus.DOWN]: 'bg-[var(--color-error)]',
  no_data: 'bg-gray-200 dark:bg-white/10',
}

// 90 plain divs colored by daily aggregate status — mirrors status.claude.com's
// uptime bar. Native title tooltip keeps v1 dependency-free.
export function UptimeBar({ days, className }: UptimeBarProps) {
  const { t } = useTranslation('common')

  return (
    <div className={cn('flex items-end gap-[2px]', className)} role="img" aria-label={t('status.uptimeBar.legend')}>
      {days.map((day) => (
        <div
          key={day.date}
          title={
            day.status === 'no_data'
              ? `${day.date} — ${t('status.uptimeBar.noData')}`
              : `${day.date} — ${t(`status.currentStatus.${day.status}`)}`
          }
          className={cn(
            'h-8 w-full min-w-[2px] flex-1 rounded-[1px] transition-opacity hover:opacity-70',
            STATUS_CELL_CLASS[day.status],
          )}
        />
      ))}
    </div>
  )
}
