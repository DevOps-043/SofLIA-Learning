import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useId, useRef, useState } from 'react'
import { PremiumSelectOptions } from './PremiumSelectOptions'
import styles from './ReportsAnalytics.module.css'
import { useOutsideClose } from './useOutsideClose'

export function PremiumSelectFilter({
  value,
  label,
  options,
  allLabel,
  onChange,
}: {
  value: string
  label: string
  options: Array<{ value: string; label: string }>
  allLabel: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const hasSelection = value !== ''
  const selectedLabel = hasSelection ? options.find((o) => o.value === value)?.label ?? allLabel : allLabel
  const close = useCallback(() => setIsOpen(false), [])
  const handleChange = useCallback((nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
  }, [onChange])

  useOutsideClose(isOpen, ref, close)

  return (
    <div
      ref={ref}
      className={`relative ${styles.selectRoot}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          close()
        }
      }}
    >
      <span className={styles.filterLabel}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={styles.selectTrigger}
        data-selected={hasSelection}
        aria-label={`${label}: ${selectedLabel}`}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.selectValue}>{selectedLabel}</span>
        <motion.svg animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen ? (
          <PremiumSelectOptions
            allLabel={allLabel}
            hasSelection={hasSelection}
            id={listboxId}
            options={options}
            value={value}
            onChange={handleChange}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
