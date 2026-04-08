'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { BusinessPanelStatCard } from '../shared/BusinessPanelStatCard'
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
  const { primaryColor, onPrimaryColor, borderColor, textColor, mutedTextColor } = useBusinessPanelTheme()

  return (
    <button
      onClick={onClick}
      className="relative px-5 py-3 rounded-[14px] flex items-center gap-2 transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: isActive ? primaryColor : 'transparent',
        border: `1px solid ${isActive ? `${primaryColor}30` : borderColor}`,
        color: isActive ? onPrimaryColor : textColor,
        opacity: isActive ? 1 : 0.72,
      }}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0"
          style={{ backgroundColor: `${primaryColor}20` }}
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <Icon
        className="w-4 h-4 relative z-10"
        style={{ color: isActive ? onPrimaryColor : mutedTextColor }}
      />
      <span className="relative z-10 text-sm font-semibold">{label}</span>
    </button>
  )
}

export function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: BusinessAnalyticsMetricCardProps) {
  return <BusinessPanelStatCard icon={<Icon className="w-5 h-5" />} title={label} value={value} iconColor={color} />
}

export function SmallMetricCard({
  icon: Icon,
  label,
  value,
  color,
}: BusinessAnalyticsMetricCardProps) {
  return (
    <BusinessPanelStatCard
      icon={<Icon className="w-4 h-4" />}
      title={label}
      value={value}
      iconColor={color}
      compact
    />
  )
}

export function BusinessAnalyticsUserAvatar({
  imageUrl,
  alt,
  initials,
  size,
  borderColor,
}: BusinessAnalyticsUserAvatarProps) {
  const {
    primaryColor,
    secondaryColor,
    borderColor: themeBorderColor,
    hoverBg,
    onPrimaryColor,
  } = useBusinessPanelTheme()
  const [hasImageError, setHasImageError] = useState(false)
  const sizeClasses = size === 'lg' ? 'w-20 h-20 rounded-2xl text-3xl' : 'w-10 h-10 rounded-full text-sm'
  const imageSizes = size === 'lg' ? '80px' : '40px'
  const borderClasses = size === 'lg' ? 'border-4' : 'border-2'

  if (imageUrl && !hasImageError) {
    return (
      <div
        className={`relative ${sizeClasses} overflow-hidden ${borderClasses} shadow-lg shrink-0`}
        style={{ borderColor: borderColor ?? themeBorderColor }}
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
      className={`${sizeClasses} flex items-center justify-center font-bold shadow-lg shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        color: onPrimaryColor,
        ...(size === 'lg'
          ? { border: '4px solid', borderColor: borderColor ?? hoverBg }
          : { border: '2px solid', borderColor: borderColor ?? themeBorderColor }),
      }}
    >
      {initials}
    </div>
  )
}
