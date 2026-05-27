'use client'

import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import type { TooltipRenderProps } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

import { translateTourKey } from '../utils/tour.i18n'
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
  const { t, i18n } = useTranslation('tours')
  const isMobile = isMobileViewport()
  const skipLabel = translateTourKey(t, i18n, 'actions.skip')
  const backLabel = translateTourKey(t, i18n, 'actions.back')
  const primaryLabel = translateTourKey(t, i18n, isLastStep ? 'actions.finish' : 'actions.next')

  return (
    <section
      {...tooltipProps}
      className={cn(
        'joyride-tooltip-container pointer-events-auto relative flex max-h-[min(420px,calc(100dvh-96px))] w-[min(calc(100vw-32px),380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-gray-800 sm:p-5',
        isMobile && 'max-w-[calc(100vw-32px)] p-4',
      )}
    >
      <button
        type="button"
        {...skipProps}
        aria-label={skipLabel}
        title={skipLabel}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <header className="flex shrink-0 items-start gap-2 border-b border-gray-100 pb-3 pr-9 dark:border-white/10">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white">
          {step.title}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {step.content}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <TourProgress current={index} total={size} />

        <div className="flex shrink-0 items-center justify-end gap-2">
          {index > 0 ? (
            <button
              type="button"
              {...backProps}
              aria-label={backLabel}
              title={backLabel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            {...primaryProps}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-accent dark:text-primary"
          >
            <span>{primaryLabel}</span>
            {!isLastStep ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          </button>
        </div>
      </footer>
    </section>
  )
}
