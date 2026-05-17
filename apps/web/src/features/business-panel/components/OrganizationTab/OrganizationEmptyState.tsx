import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { OrganizationTabTheme } from './types'

export function OrganizationEmptyState({ theme }: { theme: OrganizationTabTheme }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
      <Info className="w-20 h-20 mx-auto mb-6" style={{ color: theme.mutedTextColor }} />
      <p className="text-lg" style={{ color: theme.subtextColor }}>No hay información de organización disponible</p>
    </motion.div>
  )
}
