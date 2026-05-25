'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

interface TourProgressProps {
  current: number
  total: number
}

export function TourProgress({ current, total }: TourProgressProps) {
  const { t } = useTranslation('tours')

  if (total <= 0) {
    return null
  }

  if (total > 8) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {t('progress', { current: current + 1, total })}
      </span>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            'rounded-full transition-all',
            index === current
              ? 'h-2 w-2 bg-accent'
              : 'h-1.5 w-1.5 bg-gray-200 dark:bg-gray-600',
          )}
        />
      ))}
    </div>
  )
}
