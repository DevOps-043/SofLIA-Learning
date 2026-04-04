'use client'

import { motion } from 'framer-motion'
import { PieChart as PieChartIcon } from 'lucide-react'
import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}




export { ChartCard }
