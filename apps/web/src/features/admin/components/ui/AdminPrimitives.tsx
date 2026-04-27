'use client'

import { Fragment, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import Link from 'next/link'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { cn } from '@/shared/utils/cn'

type AdminTone = 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

interface WithClassName {
  className?: string
}

function getToneStyles(theme: ReturnType<typeof useAdminTheme>, tone: AdminTone) {
  switch (tone) {
    case 'accent':
      return { color: theme.action, surface: theme.actionSurface }
    case 'primary':
      return { color: theme.primary, surface: theme.actionSurface }
    case 'success':
      return { color: theme.success, surface: theme.successSurface }
    case 'warning':
      return { color: theme.warning, surface: theme.warningSurface }
    case 'danger':
      return { color: theme.danger, surface: theme.dangerSurface }
    case 'info':
      return { color: theme.info, surface: theme.infoSurface }
    default:
      return { color: theme.textMuted, surface: theme.surfaceSubtle }
  }
}

export function AdminPageShell({
  children,
  className,
  maxWidth = 'full',
}: WithClassName & {
  children: ReactNode
  maxWidth?: 'full' | 'wide' | 'content'
}) {
  const theme = useAdminTheme()
  const widthClass = {
    content: 'mx-auto max-w-7xl',
    full: 'w-full',
    wide: 'mx-auto max-w-[1600px]',
  }[maxWidth]

  return (
    <div
      className={cn('min-h-screen px-4 py-5 sm:px-6 lg:px-8', className)}
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className={widthClass}>{children}</div>
    </div>
  )
}

export function AdminSurface({
  children,
  className,
  interactive = false,
  style,
}: WithClassName & {
  children: ReactNode
  interactive?: boolean
  style?: CSSProperties
}) {
  const theme = useAdminTheme()

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-sm transition-all duration-200',
        interactive && 'hover:-translate-y-0.5',
        className,
      )}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        boxShadow: interactive ? theme.shadow : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function AdminSectionHeader({
  actions,
  className,
  description,
  size = 'section',
  icon: Icon,
  kicker,
  title,
}: WithClassName & {
  actions?: ReactNode
  description?: ReactNode
  icon?: ElementType
  kicker?: ReactNode
  size?: 'page' | 'section' | 'compact'
  title: ReactNode
}) {
  const theme = useAdminTheme()
  const titleClass = {
    compact: 'text-lg font-bold tracking-normal',
    page: 'text-2xl font-bold tracking-normal sm:text-3xl',
    section: 'text-xl font-bold tracking-normal',
  }[size]

  return (
    <div className={cn('mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="min-w-0">
        {kicker ? (
          <div
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.action }}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{kicker}</span>
          </div>
        ) : null}
        <h2 className={titleClass} style={{ color: theme.text }}>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6" style={{ color: theme.textMuted }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function AdminButton({
  children,
  className,
  disabled,
  icon: Icon,
  size = 'md',
  style,
  type = 'button',
  variant = 'primary',
  ...props
}: WithClassName &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: ElementType
    size?: 'sm' | 'md' | 'lg' | 'icon'
    variant?: AdminButtonVariant
  }) {
  const theme = useAdminTheme()

  const variantStyle: Record<AdminButtonVariant, CSSProperties> = {
    danger: {
      backgroundColor: theme.danger,
      borderColor: theme.danger,
      color: theme.inverseText,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: theme.textMuted,
    },
    primary: {
      backgroundColor: theme.action,
      borderColor: theme.action,
      color: theme.onAction,
      boxShadow: theme.isDark ? undefined : theme.shadow,
    },
    secondary: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      color: theme.text,
    },
    success: {
      backgroundColor: theme.success,
      borderColor: theme.success,
      color: theme.inverseText,
    },
  }

  const sizeClass = {
    icon: 'h-10 w-10 p-0',
    lg: 'h-12 px-5 text-sm',
    md: 'h-10 px-4 text-sm',
    sm: 'h-9 px-3 text-xs',
  }[size]

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-55',
        'hover:-translate-y-0.5 active:translate-y-0',
        sizeClass,
        className,
      )}
      style={{
        ...variantStyle[variant],
        ['--tw-ring-color' as string]: theme.focusRing,
        ['--tw-ring-offset-color' as string]: theme.background,
        ...style,
      }}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {size === 'icon' ? children : <span>{children}</span>}
    </button>
  )
}

export function AdminIconButton({
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
  size = 'md',
  tone = 'primary',
  type = 'button',
}: WithClassName & {
  disabled?: boolean
  icon: ElementType
  label: string
  onClick?: () => void
  size?: 'sm' | 'md'
  tone?: AdminTone
  type?: 'button' | 'submit' | 'reset'
}) {
  const theme = useAdminTheme()
  const toneStyles = getToneStyles(theme, tone)
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition hover:opacity-80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: toneStyles.surface,
        color: toneStyles.color,
        ['--tw-ring-color' as string]: theme.focusRing,
        ['--tw-ring-offset-color' as string]: theme.background,
      }}
    >
      <Icon className={iconClass} />
    </button>
  )
}

export function AdminLinkButton({
  children,
  className,
  href,
  icon: Icon,
  size = 'md',
  style,
  variant = 'primary',
}: WithClassName & {
  children: ReactNode
  href: string
  icon?: ElementType
  size?: 'sm' | 'md' | 'lg' | 'icon'
  style?: CSSProperties
  variant?: AdminButtonVariant
}) {
  const theme = useAdminTheme()

  const variantStyle: Record<AdminButtonVariant, CSSProperties> = {
    danger: {
      backgroundColor: theme.danger,
      borderColor: theme.danger,
      color: theme.inverseText,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: theme.textMuted,
    },
    primary: {
      backgroundColor: theme.action,
      borderColor: theme.action,
      color: theme.onAction,
      boxShadow: theme.isDark ? undefined : theme.shadow,
    },
    secondary: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      color: theme.text,
    },
    success: {
      backgroundColor: theme.success,
      borderColor: theme.success,
      color: theme.inverseText,
    },
  }

  const sizeClass = {
    icon: 'h-10 w-10 p-0',
    lg: 'h-12 px-5 text-sm',
    md: 'h-10 px-4 text-sm',
    sm: 'h-9 px-3 text-xs',
  }[size]

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'hover:-translate-y-0.5 active:translate-y-0',
        sizeClass,
        className,
      )}
      style={{
        ...variantStyle[variant],
        ['--tw-ring-color' as string]: theme.focusRing,
        ['--tw-ring-offset-color' as string]: theme.background,
        ...style,
      }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {size === 'icon' ? children : <span>{children}</span>}
    </Link>
  )
}

export function AdminMetricCard({
  className,
  description,
  icon: Icon,
  label,
  tone = 'accent',
  value,
}: WithClassName & {
  description?: ReactNode
  icon?: ElementType
  label: ReactNode
  tone?: AdminTone
  value: ReactNode
}) {
  const theme = useAdminTheme()
  const toneStyles = getToneStyles(theme, tone)

  return (
    <AdminSurface className={cn('group relative min-h-[90px] overflow-hidden p-4', className)} interactive>
      <div className="relative z-10 flex h-full items-center gap-4">
        {Icon ? (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ backgroundColor: toneStyles.surface, borderColor: theme.border, color: toneStyles.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
            {label}
          </p>
          <div className="mt-1 text-2xl font-extrabold leading-none" style={{ color: theme.text }}>
            {value}
          </div>
          {description ? (
            <p className="mt-2 text-xs leading-5" style={{ color: theme.textMuted }}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-10" style={{ backgroundColor: toneStyles.color }} />
    </AdminSurface>
  )
}

export function AdminToolbar({
  children,
  className,
}: WithClassName & {
  children: ReactNode
}) {
  return (
    <AdminSurface className={cn('mb-6 p-3 sm:p-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
    </AdminSurface>
  )
}

export function AdminInput({
  className,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const theme = useAdminTheme()

  return (
    <input
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition',
        'focus:ring-2',
        className,
      )}
      style={{
        backgroundColor: theme.surfaceSubtle,
        borderColor: theme.border,
        color: theme.text,
        ['--tw-ring-color' as string]: theme.focusRing,
        ...style,
      }}
      {...props}
    />
  )
}

export function AdminSelect({
  className,
  style,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const theme = useAdminTheme()

  return (
    <select
      className={cn('rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2', className)}
      style={{
        backgroundColor: theme.surfaceSubtle,
        borderColor: theme.border,
        color: theme.text,
        ['--tw-ring-color' as string]: theme.focusRing,
        ...style,
      }}
      {...props}
    />
  )
}

export function AdminTextarea({
  className,
  style,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const theme = useAdminTheme()

  return (
    <textarea
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition',
        'focus:ring-2',
        className,
      )}
      style={{
        backgroundColor: theme.surfaceSubtle,
        borderColor: theme.border,
        color: theme.text,
        ['--tw-ring-color' as string]: theme.focusRing,
        ...style,
      }}
      {...props}
    />
  )
}

export function AdminFormField({
  children,
  className,
  error,
  help,
  label,
}: WithClassName & {
  children: ReactNode
  error?: ReactNode
  help?: ReactNode
  label?: ReactNode
}) {
  const theme = useAdminTheme()

  return (
    <label className={cn('block space-y-1.5', className)}>
      {label ? (
        <span className="text-sm font-semibold" style={{ color: theme.text }}>
          {label}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="block text-xs" style={{ color: theme.danger }}>
          {error}
        </span>
      ) : help ? (
        <span className="block text-xs" style={{ color: theme.textMuted }}>
          {help}
        </span>
      ) : null}
    </label>
  )
}

export function AdminStatusBadge({
  children,
  className,
  tone = 'neutral',
}: WithClassName & {
  children: ReactNode
  tone?: AdminTone
}) {
  const theme = useAdminTheme()
  const toneStyles = getToneStyles(theme, tone)

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', className)}
      style={{
        backgroundColor: toneStyles.surface,
        borderColor: toneStyles.surface,
        color: toneStyles.color,
      }}
    >
      {children}
    </span>
  )
}

export function AdminTableContainer({
  children,
  className,
}: WithClassName & {
  children: ReactNode
}) {
  return <AdminSurface className={cn('overflow-hidden', className)}>{children}</AdminSurface>
}

export function AdminTabs<TValue extends string>({
  className,
  onChange,
  tabs,
  value,
}: WithClassName & {
  onChange: (value: TValue) => void
  tabs: Array<{ icon?: ElementType; label: ReactNode; value: TValue }>
  value: TValue
}) {
  const theme = useAdminTheme()

  return (
    <div className={cn('flex flex-wrap gap-1 rounded-2xl border p-1', className)} style={{ borderColor: theme.border, backgroundColor: theme.surfaceSubtle }}>
      {tabs.map((tab) => {
        const active = tab.value === value
        const Icon = tab.icon

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
            style={{
              backgroundColor: active ? theme.action : 'transparent',
              color: active ? theme.onAction : theme.textMuted,
            }}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function AdminModalShell({
  children,
  className,
  description,
  footer,
  icon: Icon,
  isOpen,
  onClose,
  title,
}: WithClassName & {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  icon?: ElementType
  isOpen: boolean
  onClose: () => void
  title: ReactNode
}) {
  const theme = useAdminTheme()

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ backgroundColor: theme.overlay }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel
                className={cn('w-full max-w-3xl overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-2xl', className)}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: theme.divider }}>
                  <div className="flex min-w-0 items-start gap-3">
                    {Icon ? (
                      <div className="rounded-xl p-2.5" style={{ backgroundColor: theme.actionSurface, color: theme.action }}>
                        <Icon className="h-5 w-5" />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <Dialog.Title className="text-lg font-bold" style={{ color: theme.text }}>
                        {title}
                      </Dialog.Title>
                      {description ? (
                        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                          {description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-2 transition hover:opacity-80"
                    style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[72dvh] overflow-y-auto px-5 py-5">{children}</div>
                {footer ? (
                  <div className="border-t px-5 py-4" style={{ borderColor: theme.divider }}>
                    {footer}
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
