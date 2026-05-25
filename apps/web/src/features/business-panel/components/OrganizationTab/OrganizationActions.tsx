import { motion } from 'framer-motion'
import { Loader2, Save, X } from 'lucide-react'
import type { OrganizationSectionProps } from './types'

export function OrganizationActions({ form, theme }: OrganizationSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex justify-between gap-4 pt-4"
    >
      <motion.button
        type="button"
        onClick={form.handleDiscard}
        whileHover={{ scale: 1.02, x: -2 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-3.5 rounded-xl font-semibold transition-all border flex items-center gap-2"
        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
      >
        <X className="w-5 h-5" />
        Descartar Cambios
      </motion.button>

      <motion.button
        type="submit"
        disabled={form.isSaving}
        whileHover={{ scale: form.isSaving ? 1 : 1.02, x: form.isSaving ? 0 : 2 }}
        whileTap={{ scale: form.isSaving ? 1 : 0.98 }}
        className="px-8 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl"
        style={{ backgroundColor: theme.actionColor, color: theme.onActionColor, boxShadow: `0 8px 30px color-mix(in srgb, ${theme.actionColor} 20%, transparent)` }}
      >
        {form.isSaving ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-5 h-5" />
            </motion.div>
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </motion.button>
    </motion.div>
  )
}
