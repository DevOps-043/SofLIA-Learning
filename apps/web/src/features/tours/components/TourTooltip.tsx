'use client'

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { TooltipRenderProps } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

import { isMobileViewport } from '../utils/tour.helpers'
import { TourProgress } from './TourProgress'

export function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const { t } = useTranslation('tours')
  const isMobile = isMobileViewport()

  return (
    <section
      {...tooltipProps}
      className={cn(
        'min-w-[280px] max-w-[360px] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-gray-800',
        isMobile && 'max-w-[calc(100vw-32px)] p-4',
      )}
    >
      <header className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white">
          {step.title}
        </h2>
      </header>

      <div className="py-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {step.content}
      </div>

      <footer className="flex flex-col gap-4 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <TourProgress current={index} total={size} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          {index === 0 ? (
            <button
              type="button"
              {...skipProps}
              className="cursor-pointer text-xs text-gray-400 underline transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {t('actions.skip')}
            </button>
          ) : null}

          <button
            type="button"
            {...backProps}
            disabled={index === 0}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('actions.back')}</span>
          </button>

          <button
            type="button"
            {...primaryProps}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-accent dark:text-primary"
          >
            <span>{isLastStep ? t('actions.finish') : t('actions.next')}</span>
            {!isLastStep ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          </button>
        </div>
      </footer>
    </section>
  )
}
