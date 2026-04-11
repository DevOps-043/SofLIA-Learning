import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const SHELL_SIZE_CLASSNAME = {
  default: 'max-w-7xl',
  wide: 'max-w-[92rem]',
  full: 'max-w-none',
} as const

const SHELL_SPACING_CLASSNAME = {
  compact: 'px-4 py-4 sm:px-6 lg:px-8',
  default: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
  relaxed: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10',
} as const

interface PageShellProps {
  as?: ElementType
  children: ReactNode
  className?: string
  contentClassName?: string
  size?: keyof typeof SHELL_SIZE_CLASSNAME
  spacing?: keyof typeof SHELL_SPACING_CLASSNAME
}

export function PageShell({
  as: Component = 'section',
  children,
  className,
  contentClassName,
  size = 'default',
  spacing = 'default',
}: PageShellProps) {
  return (
    <Component className={cn('w-full min-w-0', className)}>
      <div
        className={cn(
          'mx-auto w-full min-w-0 max-w-full',
          SHELL_SIZE_CLASSNAME[size],
          SHELL_SPACING_CLASSNAME[spacing],
          contentClassName,
        )}
      >
        {children}
      </div>
    </Component>
  )
}
