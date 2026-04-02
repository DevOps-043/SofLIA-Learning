'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type {
  BusinessAnalyticsMetricCardProps,
  BusinessAnalyticsTabButtonProps,
  BusinessAnalyticsUserAvatarProps,
} from './types'

export function TabButton({
  isActive,
  onClick,
  label,
  icon: Icon,
}: BusinessAnalyticsTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 overflow-hidden
        ${isActive
          ? 'font-semibold shadow-lg bg-[#0A2540] !text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 bg-white/10"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <Icon className="w-4 h-4 relative z-10" />
      <span className="relative z-10">{label}</span>
    </button>
  )
}

export function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: BusinessAnalyticsMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="relative p-5 rounded-2xl border overflow-hidden bg-white dark:bg-[#1E293B]/80 border-gray-200 dark:border-slate-700/30"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <p className="text-3xl font-bold mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm opacity-60">{label}</p>
      </div>
    </motion.div>
  )
}

export function SmallMetricCard({
  icon: Icon,
  label,
  value,
  color,
}: BusinessAnalyticsMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-[#1E293B]/80 border-gray-200 dark:border-slate-700/30"
    >
      <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs opacity-60">{label}</p>
      </div>
    </motion.div>
  )
}

export function BusinessAnalyticsUserAvatar({
  imageUrl,
  alt,
  initials,
  size,
  borderColor,
}: BusinessAnalyticsUserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const sizeClasses = size === 'lg' ? 'w-20 h-20 rounded-2xl text-3xl' : 'w-10 h-10 rounded-full text-sm'
  const imageSizes = size === 'lg' ? '80px' : '40px'
  const borderClasses = size === 'lg' ? 'border-4' : 'border-2'

  if (imageUrl && !hasImageError) {
    return (
      <div
        className={`relative ${sizeClasses} overflow-hidden ${borderClasses} shadow-lg shrink-0 border-gray-200 dark:border-gray-700`}
        style={{ ...(borderColor ? { borderColor } : {}) }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes={imageSizes}
          onError={() => setHasImageError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shrink-0`}
      style={{
        ...(size === 'lg' && borderColor ? { border: '4px solid', borderColor } : {}),
      }}
    >
      {initials}
    </div>
  )
}
