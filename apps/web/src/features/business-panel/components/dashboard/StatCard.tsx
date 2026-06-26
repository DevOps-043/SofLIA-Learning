'use client'
import type { ComponentType } from 'react'
import { ChevronRightIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '@/core/stores/themeStore'
import { useMotionSafe } from '@/lib/utils/motion'
import { PrefetchLink } from '@/core/components/PrefetchLink'

interface StatCardTheme {
  cardBg?: string
  text?: string
  borderColor?: string
  actionColor?: string
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
  const { disableHeavy, interfaceStaggerSeconds } = useMotionSafe()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const isLightMode = resolvedTheme === 'light'
  const cardBackground = isLightMode
    ? 'var(--color-bg-light)'
    : theme?.cardBg || 'rgb(15 20 25 / 60%)'
  const textColor = isLightMode ? 'var(--color-legacy-0f172a)' : theme?.text || 'var(--color-bg-light)'
  const labelColor = isLightMode ? 'var(--color-legacy-334155)' : 'var(--color-gray-400)'
  const borderColor = isLightMode ? 'var(--color-gray-200)' : theme?.borderColor || 'rgb(255 255 255 / 4%)'
  const resolvedIconColor = iconColor || theme?.actionColor || 'var(--color-primary)'
  const visibleIconColor = isLightMode
    ? `color-mix(in srgb, ${resolvedIconColor} 60%, var(--color-primary))`
    : resolvedIconColor
  const entranceDelayMs = disableHeavy ? 0 : Math.min(delay * interfaceStaggerSeconds, 0.08) * 1000

  const CardContent = (
    <div
      className={`group relative overflow-hidden rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px] hover:-translate-y-0.5${!disableHeavy ? ' animate-[scaleIn_0.5s_ease-out_both]' : ''}`}
      id={id}
      style={{
        backgroundColor: cardBackground,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        boxShadow: isLightMode ? '0 4px 20px -10px rgb(0 0 0 / 5%)' : '0 10px 30px -10px rgb(0 0 0 / 40%)',
        animationDelay: entranceDelayMs > 0 ? `${entranceDelayMs}ms` : undefined,
      }}
    >
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Icon wrapper */}
        <div
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${visibleIconColor} 8.2%, transparent), transparent)`,
            border: `1px solid color-mix(in srgb, ${visibleIconColor} 14.5%, transparent)`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: visibleIconColor }} />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
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

        {/* Navigation affordance — only shown for clickable cards */}
        {href && (
          <ChevronRightIcon
            className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200"
            style={{ color: visibleIconColor }}
          />
        )}
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-40 group-hover:scale-110"
        style={{ backgroundColor: visibleIconColor }}
      />
    </div>
  )

  if (href) return <PrefetchLink href={href} className="block w-full">{CardContent}</PrefetchLink>
  return CardContent
}
