'use client'

import { motion } from 'framer-motion'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BusinessThemeCustomizerActionsProps {
  isSaving: boolean
  onDiscard: () => void
  onReset: () => void
  onSave: () => Promise<void>
}

export function BusinessThemeCustomizerActions({
  isSaving,
  onDiscard,
  onReset,
  onSave,
}: BusinessThemeCustomizerActionsProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col justify-between gap-4 sm:flex-row"
    >
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onDiscard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all"
          style={{
            backgroundColor: 'transparent',
            borderColor: theme.borderColor,
            color: theme.subtextColor,
          }}
        >
          Descartar
        </motion.button>
        <motion.button
          type="button"
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer
        </motion.button>
      </div>
      <motion.button
        type="button"
        onClick={() => void onSave()}
        disabled={isSaving}
        whileHover={{ scale: isSaving ? 1 : 1.02 }}
        whileTap={{ scale: isSaving ? 1 : 0.98 }}
        className="relative flex items-center gap-2.5 overflow-hidden rounded-xl px-8 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: theme.actionColor,
          color: theme.onActionColor,
          boxShadow: `0 10px 30px color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
        }}
      >
        <motion.div
          className="absolute inset-0 w-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </div>
      </motion.button>
    </motion.div>
  )
}
