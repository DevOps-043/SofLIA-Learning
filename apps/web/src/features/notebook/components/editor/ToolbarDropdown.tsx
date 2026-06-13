'use client'

import { type CSSProperties, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

export interface ToolbarDropdownOption {
  value: string
  label: string
  /** Optional inline style for previewing the option (e.g. its font family). */
  previewStyle?: CSSProperties
}

interface ToolbarDropdownProps {
  value: string
  options: ToolbarDropdownOption[]
  onSelect: (value: string) => void
  ariaLabel: string
  /** Short text shown in the trigger when nothing is selected (kept compact). */
  placeholder?: string
  /** Optional leading icon shown in the trigger. */
  icon?: LucideIcon
  size?: 'sm' | 'md'
  disabled?: boolean
  triggerClassName?: string
}

/**
 * Premium Dropdown (SofLIA design system §9): replaces native <select> with a
 * styled, animated dropdown — rotating chevron, active border, animated menu
 * and a selected indicator. The trigger stays compact (icon + short label) so
 * it never truncates, while the menu shows full descriptive labels.
 */
export function ToolbarDropdown({
  value,
  options,
  onSelect,
  ariaLabel,
  placeholder,
  icon: Icon,
  size = 'sm',
  disabled = false,
  triggerClassName,
}: ToolbarDropdownProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const hasSelection = Boolean(value)
  const display = hasSelection ? (selected?.label ?? '') : (placeholder ?? '')

  const isMd = size === 'md'

  return (
    <div className={cn('relative', triggerClassName ?? 'min-w-[92px]')}>
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center gap-1.5 border bg-white font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 dark:disabled:hover:bg-white/5',
          isMd
            ? 'h-11 rounded-xl px-3.5 text-sm'
            : 'h-8 rounded-lg px-2.5 text-xs',
          hasSelection
            ? 'border-[var(--color-accent)] text-gray-900 dark:text-white'
            : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300',
        )}
      >
        {Icon && (
          <Icon
            className={cn('shrink-0 text-gray-400', isMd ? 'h-4 w-4' : 'h-3.5 w-3.5')}
          />
        )}
        {display && (
          <span
            className={cn('flex-1', isMd ? 'truncate text-left' : 'whitespace-nowrap')}
            style={selected?.previewStyle}
          >
            {display}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className={cn('shrink-0 text-gray-400', !display && 'ml-auto')}
        >
          <ChevronDown className={isMd ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-40 mt-1.5 max-h-64 w-full min-w-[150px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-[var(--color-gray-800)]"
            >
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value || 'default'}
                    type="button"
                    onClick={() => {
                      onSelect(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-[var(--color-accent)]/15 font-semibold text-[var(--color-primary)] dark:text-[var(--color-accent)]'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5',
                    )}
                  >
                    <span className="truncate" style={option.previewStyle}>
                      {option.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
