'use client'

import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

import { translateTourKey } from '../utils/tour.i18n'

interface TourProgressProps {
  current: number
  total: number
}

export function TourProgress({ current, total }: TourProgressProps) {
  const { t, i18n } = useTranslation('tours')

  if (total <= 0) {
    return null
  }

  if (total > 8) {
    return (
      <span className="min-w-10 text-xs font-medium text-gray-400 dark:text-gray-500">
        {translateTourKey(t, i18n, 'progress', { current: current + 1, total })}
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
              ? 'h-2 w-2'
              : 'h-1.5 w-1.5 bg-gray-200 dark:bg-gray-600',
          )}
          style={index === current ? { backgroundColor: 'var(--org-accent-color, var(--color-accent))' } : undefined}
        />
      ))}
    </div>
  )
}
