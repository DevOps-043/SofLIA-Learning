'use client'

import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

interface SearchResultsRegionProps {
  isBusy: boolean
  loadingLabel: string
  error?: string | null
  retryLabel?: string
  onRetry?: () => void
  children: ReactNode
}

/** Keep the search controls and existing records mounted during a request. */
export function SearchResultsRegion({ isBusy, loadingLabel, error, retryLabel, onRetry, children }: SearchResultsRegionProps) {
  return (
    <div className="space-y-3" aria-busy={isBusy}>
      {isBusy ? (
        <div role="status" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-[var(--color-accent)]" />
          {loadingLabel}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-300">
          <span>{error}</span>
          {onRetry ? <button type="button" disabled={isBusy} onClick={onRetry} className="font-semibold underline disabled:opacity-50">{retryLabel}</button> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
