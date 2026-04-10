'use client'

import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function BusinessThemeCustomizerHeader() {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border p-6"
      style={{
        background: theme.heroBackground,
        borderColor: theme.heroBorderColor,
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${theme.actionColor}, transparent 70%)` }}
        />
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 10 }}
          className="rounded-xl border p-3"
          style={{
            backgroundColor: theme.actionSurface,
            borderColor: theme.inverseBorderColor,
          }}
        >
          <Palette className="h-6 w-6" style={{ color: theme.actionColor }} />
        </motion.div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.inverseTextColor }}>
            Personalización de tema
          </h2>
          <p className="text-sm" style={{ color: theme.inverseSubtextColor }}>
            Personaliza la apariencia de tu plataforma
          </p>
        </div>
      </div>
    </motion.div>
  )
}
