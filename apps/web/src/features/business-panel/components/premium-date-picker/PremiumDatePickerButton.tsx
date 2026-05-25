import { motion } from 'framer-motion'
import { Calendar, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { BusinessPanelTheme } from './types'

interface PremiumDatePickerButtonProps {
  disabled: boolean
  displayValue: string
  isOpen: boolean
  onClear: (event: MouseEvent) => void
  onToggle: () => void
  placeholder: string
  theme: BusinessPanelTheme
  value: string
}

export function PremiumDatePickerButton({
  disabled,
  displayValue,
  isOpen,
  onClear,
  onToggle,
  placeholder,
  theme,
  value,
}: PremiumDatePickerButtonProps) {
  return (
    <motion.button
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      disabled={disabled}
      onClick={onToggle}
      style={{
        backgroundColor: theme.inputBg,
        borderColor: isOpen ? theme.primaryColor : theme.borderColor,
        boxShadow: isOpen ? `0 0 0 3px color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)` : 'none',
      }}
      type="button"
      whileTap={{ scale: 0.98 }}
    >
      <Calendar className="h-5 w-5 shrink-0" style={{ color: theme.primaryColor }} />
      <span className={`flex-1 ${value ? '' : 'opacity-50'}`} style={{ color: value ? theme.textColor : theme.mutedTextColor }}>
        {displayValue || placeholder}
      </span>
      {value && !disabled ? (
        <motion.span
          className="rounded-lg p-1 transition-colors"
          onClick={onClear}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = theme.hoverBg
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" style={{ color: theme.subtextColor }} />
        </motion.span>
      ) : null}
    </motion.button>
  )
}
