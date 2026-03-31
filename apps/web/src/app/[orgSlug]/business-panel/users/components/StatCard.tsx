'use client'

import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay: number
  trend?: number
  isDark?: boolean
  onClick?: () => void
}

function StatCard({ title, value, icon, gradient, delay, trend = 0, isDark, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      onClick={onClick}
      transition={{
        delay: delay * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 14
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      className="relative group overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      {/* Animated Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: gradient,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* Glassmorphism Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-500" />

      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: gradient }}
      />

      {/* Soft Glow */}
      <motion.div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700"
        style={{ background: gradient }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container */}
          <motion.div
            className="p-3 rounded-xl backdrop-blur-md border border-white/10"
            style={{ background: `${gradient.split(',')[0].replace('linear-gradient(135deg, ', '')}20` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>

          {/* Trend Badge */}
          {trend !== 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
            >
              <ArrowTrendingUpIcon className="h-3 w-3" />
              +{trend}%
            </motion.div>
          )}
        </div>

        <motion.h3
          className="text-3xl font-black tracking-tight mb-1"
          style={{
            color: isDark ? '#FFFFFF' : '#0F172A',
            textShadow: isDark ? '0 0 20px rgba(0,212,179,0.2)' : 'none'
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>

        <motion.p
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: isDark ? '#E5E7EB' : '#64748B', letterSpacing: '0.05em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 0.9 : 0.7 }}
          transition={{ delay: delay * 0.1 + 0.3 }}
        >
          {title}
        </motion.p>

        {/* Animated Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ delay: delay * 0.1 + 0.5, duration: 0.8 }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export { StatCard }
export type { StatCardProps }
