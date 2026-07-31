import { motion } from 'framer-motion'
import styles from './ReportsAnalytics.module.css'

export function PremiumSelectOptions({
  allLabel,
  hasSelection,
  id,
  options,
  value,
  onChange,
}: {
  allLabel: string
  hasSelection: boolean
  id: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={styles.selectMenu}
      id={id}
      role="listbox"
    >
      <SelectOptionButton label={allLabel} isSelected={!hasSelection} onClick={() => onChange('')} />
      {options.map((option) => (
        <SelectOptionButton
          key={option.value}
          label={option.label}
          isSelected={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </motion.div>
  )
}

function SelectOptionButton({
  label,
  isSelected,
  onClick,
}: {
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={styles.selectOption}
      data-selected={isSelected}
    >
      {label}
    </button>
  )
}
