'use client'

import { motion } from 'framer-motion'

export interface CourseStatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  delay: number
  isDark?: boolean
}

export function CourseStatCard({ title, value, icon: Icon, color, delay, isDark }: CourseStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group overflow-hidden rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--org-card-background, #1E2329)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)` }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <h4 className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h4>
          <p className="text-sm font-medium" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B' }}>
            {title}
          </p>
        </div>
      </div>

      {/* Subtle gradient bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-r-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ delay: delay * 0.1 + 0.3, duration: 0.6 }}
      />
    </motion.div>
  )
}
