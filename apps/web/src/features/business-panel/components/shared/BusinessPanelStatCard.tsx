'use client'

import { motion } from 'framer-motion'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { BusinessPanelStatCardProps } from './business-panel-stat-card.types'

export function BusinessPanelStatCard({
  title,
  value,
  iconColor,
  delay = 0,
  trend = 0,
  onClick,
  compact = false,
  icon,
}: BusinessPanelStatCardProps) {
  const { textColor, subtextColor, cardBg, borderColor, isDark } = useBusinessPanelTheme()
  const isPositive = trend >= 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start ${
        onClick ? 'cursor-pointer' : ''
      } ${compact ? 'min-h-[78px] p-4' : 'min-h-[90px] p-4'}`}
      style={{
        backgroundColor: cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        boxShadow: isDark
          ? '0 10px 30px -10px rgba(0,0,0,0.4)'
          : '0 4px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      <div className={`relative z-10 flex items-center w-full ${compact ? 'gap-3' : 'gap-4'}`}>
        <div
          className={`flex-shrink-0 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05] ${
            compact ? 'w-10 h-10' : 'w-12 h-12'
          }`}
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${iconColor} 8.2%, transparent), transparent)`,
            border: `1px solid color-mix(in srgb, ${iconColor} 14.5%, transparent)`,
          }}
        >
          <div
            className={`flex items-center justify-center ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
            style={{ color: iconColor }}
          >
            {icon}
          </div>
        </div>

        <div className="flex flex-col justify-center overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p
              className="text-[10px] uppercase tracking-widest font-bold truncate"
              style={{ color: subtextColor, opacity: 0.9 }}
            >
              {title}
            </p>
            {trend !== 0 && (
              <div
                className={`flex items-center text-[10px] font-bold ${
                  isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {isPositive ? '+' : ''}
                {trend}%
              </div>
            )}
          </div>
          <p
            className={`font-extrabold leading-none tracking-tight truncate w-full ${
              compact ? 'text-xl' : 'text-2xl'
            }`}
            style={{ color: textColor }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>

      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-40 group-hover:scale-110"
        style={{ backgroundColor: iconColor }}
      />

      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: iconColor }}
        initial={{ width: 0 }}
        whileHover={{ width: compact ? '32%' : '40%' }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  )
}
