'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export function PlanSummaryHeader() {
  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
      >
        <CheckCircle className="w-8 h-8 text-white" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Resumen de tu Plan
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Revisa los detalles antes de confirmar
      </p>
    </div>
  )
}
