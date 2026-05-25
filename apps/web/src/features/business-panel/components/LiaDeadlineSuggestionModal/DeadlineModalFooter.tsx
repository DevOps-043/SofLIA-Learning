'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import type { BusinessPanelTheme, DeadlineStep, DeadlineT } from './types'

interface DeadlineModalFooterProps {
  step: DeadlineStep
  theme: BusinessPanelTheme
  t: DeadlineT
  onBack: () => void
  onClose: () => void
  onConfirm: () => void
}

export function DeadlineModalFooter({
  step,
  theme,
  t,
  onBack,
  onClose,
  onConfirm,
}: DeadlineModalFooterProps) {
  return (
    <div className="flex items-center justify-between border-t p-6" style={{ borderColor: theme.borderColor }}>
      {step === 'confirm' ? (
        <>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors"
            style={{ color: theme.textColor }}
            onMouseEnter={event => { event.currentTarget.style.backgroundColor = theme.hoverBg }}
            onMouseLeave={event => { event.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('liaSuggestion.buttons.back')}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="ml-auto flex items-center gap-2 rounded-xl px-8 py-3 font-medium"
            style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
          >
            {t('liaSuggestion.buttons.confirm')}
            <CheckCircle className="h-4 w-4" style={{ color: theme.onPrimaryColor }} />
          </motion.button>
        </>
      ) : (
        <div className="ml-auto">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="rounded-xl border px-6 py-3 font-medium"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          >
            {t('liaSuggestion.buttons.cancel', { defaultValue: 'Cerrar' })}
          </motion.button>
        </div>
      )}
    </div>
  )
}
