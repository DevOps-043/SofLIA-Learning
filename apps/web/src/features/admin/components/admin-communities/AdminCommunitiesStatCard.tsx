'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { adminCommunitiesColors } from './shared'

interface AdminCommunitiesStatCardProps {
  title: string
  value: number
  Icon: LucideIcon
  iconColor: string
  gradientClassName: string
  delay: number
  trend?: number
}

export function AdminCommunitiesStatCard({
  title,
  value,
  Icon,
  iconColor,
  gradientClassName,
  delay,
  trend,
}: AdminCommunitiesStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
      className="relative group overflow-hidden rounded-2xl p-6 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${adminCommunitiesColors.bgSecondary} 0%, ${adminCommunitiesColors.bgTertiary} 100%)`
      }}
    >
      <motion.div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradientClassName}`} />
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
        style={{ background: adminCommunitiesColors.accent }}
      />
      <div
        className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
        style={{ background: adminCommunitiesColors.accent, transform: 'translate(30%, 30%)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className="p-3 rounded-xl border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${adminCommunitiesColors.accent}20 0%, ${adminCommunitiesColors.primary}40 100%)`
            }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>

          {trend !== undefined && (
            <motion.div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay * 0.1 + 0.3, type: 'spring' }}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </motion.div>
          )}
        </div>

        <motion.h3
          className="text-4xl font-bold text-white mb-2 tracking-tight"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>

        <p className="text-sm font-medium" style={{ color: adminCommunitiesColors.grayMedium }}>{title}</p>

        <motion.div
          className="absolute bottom-0 left-0 h-1 rounded-full"
          style={{ background: `linear-gradient(90deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)` }}
          initial={{ width: 0 }}
          animate={{ width: '40%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )
}
