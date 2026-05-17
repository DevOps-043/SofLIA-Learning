'use client'

import { motion } from 'framer-motion'
import { Settings2 } from 'lucide-react'

export function PersonalizationSectionHeader() {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
      <div className="p-3 rounded-xl bg-amber-500/20">
        <Settings2 className="w-6 h-6 text-amber-400" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Login Personalizado</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configura tu enlace de inicio de sesion exclusivo y opciones de SSO</p>
      </div>
    </motion.div>
  )
}
