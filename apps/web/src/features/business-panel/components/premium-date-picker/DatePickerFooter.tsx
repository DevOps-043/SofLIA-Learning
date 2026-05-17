import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { BusinessPanelTheme } from './types'

interface DatePickerFooterProps {
  handleToday: () => void
  onClear: () => void
  theme: BusinessPanelTheme
}

export function DatePickerFooter({ handleToday, onClear, theme }: DatePickerFooterProps) {
  const { t } = useTranslation('common')

  return (
    <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: theme.borderColor }}>
      <motion.button
        className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        onClick={onClear}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = theme.hoverBg
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'transparent'
        }}
        style={{ color: theme.subtextColor }}
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {t('datePicker.clear')}
      </motion.button>
      <motion.button
        className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        onClick={handleToday}
        style={{
          backgroundColor: `${theme.accentColor}20`,
          color: theme.accentColor,
        }}
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {t('datePicker.today')}
      </motion.button>
    </div>
  )
}
