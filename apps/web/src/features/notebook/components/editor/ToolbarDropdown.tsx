'use client'

import { type CSSProperties, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import styles from '../NotebookEditor.module.css'

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
    <div className={cn(styles.toolbarDropdown, triggerClassName ?? 'min-w-[92px]')}>
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          styles.toolbarDropdownTrigger,
          isMd && styles.toolbarDropdownTriggerMd,
          hasSelection && styles.toolbarDropdownTriggerSelected,
          open && styles.toolbarDropdownTriggerOpen,
        )}
      >
        {Icon && (
          <Icon
            className={cn(styles.toolbarDropdownIcon, isMd && styles.toolbarDropdownIconMd)}
          />
        )}
        {display && (
          <span
            className={styles.toolbarDropdownValue}
            style={selected?.previewStyle}
          >
            {display}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className={styles.toolbarDropdownChevron}
        >
          <ChevronDown className={isMd ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className={styles.toolbarDropdownOverlay}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={styles.toolbarDropdownMenu}
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
                      styles.toolbarDropdownOption,
                      isSelected && styles.toolbarDropdownOptionSelected,
                    )}
                  >
                    <span className={styles.toolbarDropdownOptionLabel} style={option.previewStyle}>
                      {option.label}
                    </span>
                    {isSelected && <Check className={styles.toolbarDropdownCheck} />}
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
