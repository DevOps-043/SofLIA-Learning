'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FilterOption, UsersFilterBarTheme } from './users-filter-bar.types'

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

export function FilterDropdown({ activeColor, icon, isOpen, label, onToggle, options, setOpen, setValue, theme, value, variant = 'primary' }: FilterDropdownProps) {
  const isAdvanced = variant === 'advanced'
  return (
    <div className={isAdvanced ? 'relative min-w-[150px]' : 'relative min-w-[140px]'}>
      <button type="button" onClick={onToggle} className={isAdvanced ? 'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm' : 'flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3.5 transition-all duration-300'} style={{ backgroundColor: isAdvanced ? theme.hoverBg : theme.cardBg, borderColor: value !== 'all' ? activeColor : theme.borderColor, color: theme.textColor }}>
        <span className="flex items-center gap-2 truncate">{icon}<span className="truncate">{label}</span></span>
        {!isAdvanced ? <motion.svg animate={{ rotate: isOpen ? 180 : 0 }} className="h-4 w-4 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></motion.svg> : null}
      </button>
      <AnimatePresence>
        {isOpen ? <motion.div initial={{ opacity: 0, y: -10, scale: isAdvanced ? 1 : 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: isAdvanced ? 1 : 0.95 }} transition={{ duration: 0.15 }} className={isAdvanced ? 'absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-xl' : 'absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-2xl'} style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>{options.map((option) => <button key={option.value} type="button" onClick={() => { setValue(option.value); setOpen(false) }} className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: value === option.value ? `color-mix(in srgb, ${activeColor} 12.5%, transparent)` : 'transparent', color: value === option.value ? (theme.isDark ? theme.textColor : activeColor) : theme.mutedTextColor }}>{option.label}</button>)}</motion.div> : null}
      </AnimatePresence>
    </div>
  )
}
