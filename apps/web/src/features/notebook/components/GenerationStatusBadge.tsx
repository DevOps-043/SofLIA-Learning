'use client'

import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import type { GenerationStatus } from '../types'

const STYLE: Record<GenerationStatus, string> = {
  queued: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  processing: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  partial: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ready: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  failed: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
  stale: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
}

export function GenerationStatusBadge({
  status,
  compact = false,
  className,
}: {
  status: GenerationStatus
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation('notebook')
  const iconClassName = 'h-3 w-3 shrink-0'
  const icon =
    status === 'processing' ? (
      <Loader2 className={cn(iconClassName, 'animate-spin')} />
    ) : status === 'ready' ? (
      <CheckCircle2 className={iconClassName} />
    ) : status === 'failed' ? (
      <AlertCircle className={iconClassName} />
    ) : status === 'stale' ? (
      <RefreshCw className={iconClassName} />
    ) : (
      <Clock3 className={iconClassName} />
    )

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        STYLE[status],
        className,
      )}
      title={t(`generation.statusDescription.${status}`)}
    >
      {icon}
      {!compact && <span className="truncate">{t(`generation.status.${status}`)}</span>}
    </span>
  )
}
