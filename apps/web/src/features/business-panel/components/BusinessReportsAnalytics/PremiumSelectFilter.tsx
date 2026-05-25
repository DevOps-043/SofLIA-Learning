import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { PremiumSelectOptions } from './PremiumSelectOptions'
import { useOutsideClose } from './useOutsideClose'
import type { ThemeTokens } from './types'

export function PremiumSelectFilter({
  value,
  label,
  options,
  allLabel,
  theme,
  onChange,
}: {
  value: string
  label: string
  options: Array<{ value: string; label: string }>
  allLabel: string
  theme: ThemeTokens
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hasSelection = value !== ''
  const selectedLabel = hasSelection ? options.find((o) => o.value === value)?.label ?? allLabel : allLabel
  const close = useCallback(() => setIsOpen(false), [])
  const handleChange = useCallback((nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
  }, [onChange])

  useOutsideClose(isOpen, ref, close)

  return (
    <div ref={ref} className="relative flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200"
        style={{ backgroundColor: theme.inputBg, borderColor: hasSelection ? theme.actionColor : theme.borderColor, color: theme.textColor }}
      >
        <span className="truncate text-sm leading-none">{selectedLabel}</span>
        <motion.svg animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen ? (
          <PremiumSelectOptions
            allLabel={allLabel}
            hasSelection={hasSelection}
            options={options}
            theme={theme}
            value={value}
            onChange={handleChange}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
