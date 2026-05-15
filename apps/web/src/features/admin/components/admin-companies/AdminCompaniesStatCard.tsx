'use client'

import { motion } from 'framer-motion'
import type { ElementType } from 'react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminCompaniesStatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: ElementType
  color: string
  delay: number
}

export function AdminCompaniesStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay,
}: AdminCompaniesStatCardProps) {
  const theme = useAdminPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative flex min-h-[96px] items-center justify-start overflow-hidden rounded-[16px] p-4 shadow-sm transition-all duration-300 hover:shadow-md"
      style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: theme.isDark
          ? '0 10px 30px -10px rgba(0,0,0,0.4)'
          : '0 4px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="relative z-10 flex w-full items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
            background: `linear-gradient(135deg, ${color}15, transparent)`,
            border: `1px solid ${color}25`,
            color,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 overflow-hidden">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.subtextColor }}>
              {title}
            </p>
          </div>
          <p className="truncate text-2xl font-extrabold leading-none tracking-tight" style={{ color: theme.textColor }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 truncate text-xs font-medium" style={{ color: theme.mutedTextColor }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-[40px] transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />

      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: color }}
        initial={{ width: 0 }}
        whileHover={{ width: '40%' }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  )
}
