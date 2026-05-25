'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import type {
  BusinessUserStatsTheme,
} from './types'

export function BusinessUserStatsMetricCard({
  icon: Icon,
  label,
  value,
  iconColor,
  delay = 0,
}: {
  icon: LucideIcon
  label: string
  value: number | string | null | undefined
  iconColor: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-[1.8rem] p-5 lg:p-6 group cursor-default border transition-all hover:scale-[1.02] shadow-xl"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[64px] opacity-0 group-hover:opacity-20 transition-opacity duration-700"
        style={{ backgroundColor: iconColor }}
      />
      
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500"
          style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 12.5%, transparent)` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
           {label}
        </div>
      </div>

      <div className="text-4xl font-black tracking-tight flex items-baseline gap-1">
        <span>{value !== undefined && value !== null ? value : '-'}</span>
      </div>
    </motion.div>
  )
}

export function BusinessUserStatsEmptyState({
  icon: Icon,
  label,
  theme,
}: {
  icon: LucideIcon
  label: string
  theme: BusinessUserStatsTheme
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border"
        style={{
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.02)',
          borderColor: theme.modalBorder
        }}
      >
        <Icon
          className="w-10 h-10 opacity-30"
          style={{ color: theme.textColor }}
        />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-12" style={{ color: theme.textColor }}>{label}</p>
    </div>
  )
}
