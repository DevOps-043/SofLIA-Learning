'use client'

import type { ComponentType, CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { ChartBarIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'

export interface PanelVisualTheme {
  accent: string
  borderColor: string
  cardBg: string
  inputBg?: string
  inverseSubtext?: string
  inverseText?: string
  isLightMode: boolean
  mutedText?: string
  primary: string
  secondary?: string
  subtext: string
  text: string
}

type PanelIcon = ComponentType<{
  className?: string
  style?: CSSProperties
}>

function colorWithAlpha(color: string, alpha: number) {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha))

  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    if (hex.length === 6 || hex.length === 8) {
      const red = parseInt(hex.substring(0, 2), 16)
      const green = parseInt(hex.substring(2, 4), 16)
      const blue = parseInt(hex.substring(4, 6), 16)
      return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`
    }
  }

  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${normalizedAlpha})`)
  }

  if (color.startsWith('rgba(')) {
    return color.replace(/rgba\(([^)]+)\)/, (_, values: string) => {
      const parts = values.split(',').map((part) => part.trim()).slice(0, 3)
      return `rgba(${parts.join(', ')}, ${normalizedAlpha})`
    })
  }

  return `color-mix(in srgb, ${color} ${Math.round(normalizedAlpha * 100)}%, transparent)`
}

export interface PanelDashboardHeroProps {
  eyebrow: string
  greeting: string
  todayLabel: string
  userName: string
  subtitle: string
  theme: PanelVisualTheme
  imageSrc?: string
  imageAlt?: string
}

export function PanelDashboardHero({
  eyebrow,
  greeting,
  imageAlt = 'Dashboard Background',
  imageSrc = '/images/dashboard-header.png',
  subtitle,
  theme,
  todayLabel,
  userName,
}: PanelDashboardHeroProps) {
  const inverseText = theme.inverseText || 'var(--color-bg-light)'
  const inverseSubtext = theme.inverseSubtext || colorWithAlpha(inverseText, 0.7)

  return (
    <motion.div
      id="tour-hero-section"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="group relative mb-4 overflow-hidden rounded-2xl p-4 md:mb-8 md:rounded-3xl md:p-8"
    >
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 z-10 mix-blend-multiply"
          style={{ backgroundColor: colorWithAlpha(theme.primary, 0.8) }}
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(to right, ${theme.primary}, ${colorWithAlpha(theme.primary, 0.6)}, transparent)`,
          }}
        />
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          unoptimized
          className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 100vw"
        />
      </div>

      <div className="relative z-10">
        <div className="mb-1 flex items-center gap-2 md:mb-2 md:gap-3">
          <SparklesIcon className="h-4 w-4 md:h-6 md:w-6" style={{ color: theme.accent }} />
          <span
            className="text-[10px] font-medium uppercase tracking-wide md:text-sm"
            style={{ color: inverseText }}
          >
            {eyebrow}
          </span>
        </div>

        <motion.h1
          className="mb-1 text-xl font-bold leading-tight md:mb-2 md:text-3xl lg:text-4xl"
          style={{ color: inverseText }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {greeting}, {userName}
        </motion.h1>

        <motion.p
          className="line-clamp-2 max-w-xl text-xs md:line-clamp-none md:text-base lg:text-lg"
          style={{ color: inverseSubtext }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="mt-3 flex items-center gap-2 md:mt-6 md:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="flex items-center gap-1.5 text-[10px] md:gap-2 md:text-sm"
            style={{ color: colorWithAlpha(inverseText, 0.9) }}
          >
            <ClockIcon className="h-3 w-3 md:h-4 md:w-4" />
            <span>{todayLabel}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export interface PanelStatCardProps {
  delay: number
  href?: string
  icon?: PanelIcon
  iconColor: string
  id?: string
  theme: PanelVisualTheme
  title: string
  value: string | number
}

export function PanelStatCard({
  delay,
  href,
  icon: Icon = ChartBarIcon,
  iconColor,
  id,
  theme,
  title,
  value,
}: PanelStatCardProps) {
  const surfaceBorder = theme.isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.04)'
  const card = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative flex min-h-[90px] items-center justify-start overflow-hidden rounded-[16px] p-4 shadow-sm transition-all duration-300 hover:shadow-md"
      id={id}
      style={{
        backgroundColor: theme.cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${surfaceBorder}`,
        boxShadow: theme.isLightMode
          ? '0 4px 20px -10px rgba(0,0,0,0.05)'
          : '0 10px 30px -10px rgba(0,0,0,0.4)',
      }}
    >
      <div className="relative z-10 flex w-full items-center gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
            background: `linear-gradient(135deg, ${colorWithAlpha(iconColor, 0.08)}, transparent)`,
            border: `1px solid ${colorWithAlpha(iconColor, 0.15)}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>

        <div className="flex min-w-0 flex-col justify-center overflow-hidden">
          <p
            className="mb-1 w-full truncate text-[10px] font-bold uppercase tracking-widest"
            style={{ color: theme.subtext, opacity: 0.9 }}
          >
            {title}
          </p>
          <p
            className="w-full truncate text-2xl font-extrabold leading-none tracking-tight"
            style={{ color: theme.text }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-[40px] transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-40"
        style={{ backgroundColor: iconColor }}
      />
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {card}
      </Link>
    )
  }

  return card
}

export interface PanelQuickActionProps {
  delay: number
  description: string
  href: string
  icon: PanelIcon
  iconColor: string
  theme: PanelVisualTheme
  title: string
}

export function PanelQuickAction({
  delay,
  description,
  href,
  icon: Icon,
  iconColor,
  theme,
  title,
}: PanelQuickActionProps) {
  const surfaceBorder = theme.isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.04)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 + 0.3, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      <Link href={href} className="block w-full">
        <div
          className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[16px] p-4 shadow-sm transition-all duration-300 hover:shadow-md"
          style={{
            backgroundColor: theme.cardBg,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${surfaceBorder}`,
          }}
        >
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
            style={{
              background: `linear-gradient(135deg, ${colorWithAlpha(iconColor, 0.08)}, transparent)`,
              border: `1px solid ${colorWithAlpha(iconColor, 0.15)}`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <h4 className="truncate text-[14px] font-bold" style={{ color: theme.text }}>
              {title}
            </h4>
            <p className="mt-0.5 truncate text-[11px] opacity-70" style={{ color: theme.subtext }}>
              {description}
            </p>
          </div>

          <div
            className="translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            style={{ color: iconColor }}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </div>

          <div
            className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 blur-[30px] transition-all duration-700 ease-out group-hover:opacity-10"
            style={{ backgroundColor: iconColor }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

export interface PanelSectionTitleProps {
  action?: ReactNode
  subtitle: string
  theme: PanelVisualTheme
  title: string
}

export function PanelSectionTitle({
  action,
  subtitle,
  theme,
  title,
}: PanelSectionTitleProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold" style={{ color: theme.text }}>
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtext }}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  )
}
