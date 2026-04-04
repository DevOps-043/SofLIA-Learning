'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/core/stores/themeStore'

function getLuminance(color: string): number {
  try {
    const hex = color.replace('#', '').trim()
    if (hex.length !== 6) return 0.3
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  } catch {
    return 0.3
  }
}

export interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  href: string
  color: string
  delay: number
}

export function QuickAction({ title, description, icon: Icon, href, color, delay }: QuickActionProps) {
  const { resolvedTheme } = useThemeStore()
  const isLightMode = resolvedTheme === 'light'

  const luminance = getLuminance(color)
  const isLightColor = luminance > 0.5
  const iconColor = '#FFFFFF'

  let backgroundColor = color
  if (isLightMode && isLightColor) {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 60)
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 60)
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 60)
    backgroundColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.05 + 0.3, duration: 0.3 }}
    >
      <Link href={href}>
        <div className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:brightness-110 group cursor-pointer" style={{ backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 35, 41), 0.5)' }}>
          <div className="p-3 rounded-lg transition-colors" style={{ backgroundColor }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm transition-colors" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>{title}</h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--org-text-color, #FFFFFF)', opacity: 0.7 }}>{description}</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-[-5px] group-hover:translate-x-0" style={{ color: 'var(--org-accent-color, #00D4B3)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
