'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PieChart as PieChartIcon } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border p-5"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-xl border flex items-center justify-center"
          style={{
            backgroundColor: panelTheme.actionSurface,
            borderColor: `${panelTheme.actionColor}22`,
          }}
        >
          <PieChartIcon className="w-4 h-4" style={{ color: panelTheme.actionColor }} />
        </div>
        <h3 className="font-semibold" style={{ color: panelTheme.textColor }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  )
}

export { ChartCard }
