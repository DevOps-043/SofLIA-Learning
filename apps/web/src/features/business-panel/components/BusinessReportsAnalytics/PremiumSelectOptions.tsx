import { motion } from 'framer-motion'
import type { ThemeTokens } from './types'

export function PremiumSelectOptions({
  allLabel,
  hasSelection,
  options,
  theme,
  value,
  onChange,
}: {
  allLabel: string
  hasSelection: boolean
  options: Array<{ value: string; label: string }>
  theme: ThemeTokens
  value: string
  onChange: (value: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border shadow-2xl"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.dividerColor }}
    >
      <SelectOptionButton label={allLabel} isSelected={!hasSelection} theme={theme} onClick={() => onChange('')} />
      {options.map((option) => (
        <SelectOptionButton
          key={option.value}
          label={option.label}
          isSelected={value === option.value}
          theme={theme}
          onClick={() => onChange(option.value)}
        />
      ))}
    </motion.div>
  )
}

function SelectOptionButton({
  label,
  isSelected,
  theme,
  onClick,
}: {
  label: string
  isSelected: boolean
  theme: ThemeTokens
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-2.5 text-left text-sm transition-colors"
      style={{ backgroundColor: isSelected ? `${theme.actionColor}25` : 'transparent', color: isSelected ? theme.actionColor : theme.subtextColor }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = theme.hoverBg }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {label}
    </button>
  )
}
