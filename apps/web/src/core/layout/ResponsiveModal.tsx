import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const MODAL_SIZE_CLASSNAME = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-[min(100%,96rem)]',
} as const

interface ResponsiveModalViewportProps {
  children: ReactNode
  className?: string
}

export function ResponsiveModalViewport({
  children,
  className,
}: ResponsiveModalViewportProps) {
  return (
    <div className={cn('fixed inset-0 z-50 overflow-y-auto', className)}>
      <div className="flex min-h-app-dynamic items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
        {children}
      </div>
    </div>
  )
}

interface ResponsiveModalPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  size?: keyof typeof MODAL_SIZE_CLASSNAME
}

export function ResponsiveModalPanel({
  children,
  className,
  size = 'lg',
  ...props
}: ResponsiveModalPanelProps) {
  return (
    <div
      className={cn(
        'relative flex w-full min-w-0 flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800',
        'max-h-app-dynamic rounded-none sm:max-h-[min(calc(var(--soflia-viewport-height)-2rem),960px)] sm:rounded-[28px]',
        MODAL_SIZE_CLASSNAME[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ResponsiveModalBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  stickyOnMobile?: boolean
}

export function ResponsiveModalFooter({
  children,
  className,
  stickyOnMobile = true,
  ...props
}: ResponsiveModalFooterProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-500/30 dark:bg-carbon-800 sm:px-6',
        stickyOnMobile && 'sticky bottom-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
