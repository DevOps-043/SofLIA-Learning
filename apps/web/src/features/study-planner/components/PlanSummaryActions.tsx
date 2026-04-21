'use client'

import { motion } from 'framer-motion'
import { Edit, Save } from 'lucide-react'

interface PlanSummaryActionsProps {
  errors: string[]
  isLoading: boolean
  onCancel?: () => void
  onConfirm?: () => void
  onEdit?: () => void
}

export function PlanSummaryActions({
  errors,
  isLoading,
  onCancel,
  onConfirm,
  onEdit,
}: PlanSummaryActionsProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        {onEdit && (
          <motion.button
            onClick={onEdit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Edit className="w-5 h-5" />
            Modificar Plan
          </motion.button>
        )}

        {onConfirm && (
          <motion.button
            onClick={onConfirm}
            disabled={isLoading || errors.length > 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Confirmar y Guardar
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 transition-colors"
        >
          Cancelar y volver
        </button>
      )}
    </>
  )
}
