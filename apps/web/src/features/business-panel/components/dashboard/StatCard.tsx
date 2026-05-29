'use client'
import { motion } from 'framer-motion'
import type { ComponentType } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '@/core/stores/themeStore'
import { useMotionSafe } from '@/lib/utils/motion'
import { PrefetchLink } from '@/core/components/PrefetchLink'

interface StatCardTheme {
  cardBg?: string
  text?: string
  borderColor?: string
}

export interface StatCardProps {
  title: string
  value: string | number
  change?: number
  backgroundImage?: string
  gradient?: string
  gradientStyle?: React.CSSProperties
  delay: number
  href?: string
  id?: string
  theme?: StatCardTheme
  iconColor?: string
  icon?: ComponentType<{ className?: string, style?: React.CSSProperties }>
}

export function StatCard({ title, value, delay, href, id, theme, iconColor, icon: Icon = ChartBarIcon }: StatCardProps) {
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isLightMode = resolvedTheme === 'light'
  const cardBackground = isLightMode
    ? 'var(--color-bg-light)'
    : theme?.cardBg || 'rgb(15 20 25 / 60%)'
  const textColor = isLightMode ? 'var(--color-legacy-0f172a)' : theme?.text || 'var(--color-bg-light)'
  const labelColor = isLightMode ? 'var(--color-legacy-334155)' : 'var(--color-gray-400)'
  const borderColor = isLightMode ? 'var(--color-gray-200)' : theme?.borderColor || 'rgb(255 255 255 / 4%)'
  const resolvedIconColor = iconColor || (isLightMode ? 'var(--color-primary)' : 'var(--color-accent)')
  const visibleIconColor = isLightMode
    ? `color-mix(in srgb, ${resolvedIconColor} 60%, var(--color-primary))`
    : resolvedIconColor
  const entranceDelay = disableHeavy ? 0 : Math.min(delay * interfaceStaggerSeconds, 0.08)

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      whileHover={disableHeavy ? undefined : { y: -2, transition: interfaceTransition }}
      className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px]"
      id={id}
      style={{
        backgroundColor: cardBackground,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        boxShadow: isLightMode ? '0 4px 20px -10px rgb(0 0 0 / 5%)' : '0 10px 30px -10px rgb(0 0 0 / 40%)',
      }}
    >
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Sleek icon wrapper */}
        <div 
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
             background: `linear-gradient(135deg, color-mix(in srgb, ${visibleIconColor} 8.2%, transparent), transparent)`,
             border: `1px solid color-mix(in srgb, ${visibleIconColor} 14.5%, transparent)`
          }}
        >
          <Icon className="w-5 h-5" style={{ color: visibleIconColor }} />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center overflow-hidden">
          <p 
            className="text-[10px] uppercase tracking-widest font-bold mb-1 truncate w-full" 
            style={{ color: labelColor, opacity: 0.9 }}
          >
            {title}
          </p>
          <p 
            className="text-2xl font-extrabold leading-none tracking-tight truncate w-full" 
            style={{ color: textColor }}
          >
            {value}
          </p>
        </div>
      </div>

      {/* Subtle modern abstract glow */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-40 group-hover:scale-110"
        style={{ backgroundColor: visibleIconColor }}
      />
    </motion.div>
  )

  if (href) return <PrefetchLink href={href} className="block w-full">{CardContent}</PrefetchLink>
  return CardContent
}
