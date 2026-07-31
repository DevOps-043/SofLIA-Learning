'use client'

import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

import type { FilterOption, UsersFilterBarTheme } from './users-filter-bar.types'
import styles from '../UsersPanel.module.css'

type FilterDropdownProps = {
  activeColor: string
  icon?: ReactNode
  isOpen: boolean
  label: string
  onToggle: () => void
  options: FilterOption[]
  setValue: (value: string) => void
  setOpen: (value: boolean) => void
  theme: UsersFilterBarTheme
  value: string
  variant?: 'primary' | 'advanced'
}

export function FilterDropdown({ activeColor, icon, isOpen, label, onToggle, options, setOpen, setValue, value, variant = 'primary' }: FilterDropdownProps) {
  const isAdvanced = variant === 'advanced'
  const dropdownStyle = { '--filter-accent': activeColor } as CSSProperties

  return (
    <div
      className={`${styles.dropdown} ${isAdvanced ? styles.dropdownAdvanced : ''}`}
      style={dropdownStyle}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`${styles.filterTrigger} ${isOpen || value !== 'all' ? styles.filterTriggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.filterTriggerValue}>
          {icon}
          <span>{label}</span>
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} aria-hidden="true">
          <ChevronDown className={styles.filterChevron} />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.985 }}
            transition={{ duration: 0.14 }}
            className={styles.filterMenu}
            role="listbox"
          >
            {options.map((option) => {
              const selected = value === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setValue(option.value)
                    setOpen(false)
                  }}
                  className={`${styles.filterOption} ${selected ? styles.filterOptionSelected : ''}`}
                >
                  <span>{option.label}</span>
                  {selected ? <Check aria-hidden="true" /> : null}
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
