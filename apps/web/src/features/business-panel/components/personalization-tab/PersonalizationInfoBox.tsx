'use client'

import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useMotionSafe } from '../../../../lib/utils/motion'

export function PersonalizationInfoBox() {
  const { disableHeavy } = useMotionSafe()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl p-5 border relative overflow-hidden bg-blue-500/10 border-blue-500/30">
      <div className="flex items-start gap-4 relative z-10">
        <motion.div animate={disableHeavy ? {} : { rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="p-2 rounded-lg bg-blue-500/20">
          <Info className="w-5 h-5 text-blue-400" />
        </motion.div>
        <div className="flex-1">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong className="text-blue-800 dark:text-blue-200">Nota:</strong> Los usuarios que accedan a tu link personalizado veran el login con tu logo y branding. Si habilitas SSO, podran elegir iniciar sesion con Google o Microsoft ademas de email/contraseña.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
