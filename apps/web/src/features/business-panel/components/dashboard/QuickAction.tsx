'use client'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useMotionSafe } from '@/lib/utils/motion'
import { PrefetchLink } from '@/core/components/PrefetchLink'

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
  const { effectiveStyles } = useOrganizationStylesContext()
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  
  const panelStyles = effectiveStyles?.panel
  const textColor = isLightMode ? 'var(--color-legacy-0f172a)' : (panelStyles?.text_color || 'var(--color-bg-light)')
  const mutedTextColor = isLightMode ? 'var(--color-legacy-334155)' : 'var(--color-gray-400)'
  const iconColor = color || 'var(--color-accent)'
  const visibleIconColor = isLightMode
    ? `color-mix(in srgb, ${iconColor} 60%, var(--color-primary))`
    : iconColor
  const entranceDelay = disableHeavy ? 0 : Math.min(delay * interfaceStaggerSeconds, 0.08)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      whileHover={disableHeavy ? undefined : { scale: 1.01 }}
      className="w-full"
    >
      <PrefetchLink href={href} className="block w-full">
        <div 
          className="group relative overflow-hidden rounded-[16px] p-4 transition-all duration-300 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md"
          style={{
            backgroundColor: isLightMode ? 'var(--color-bg-light)' : 'rgb(15 20 25 / 60%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLightMode ? 'var(--color-gray-200)' : 'rgb(255 255 255 / 4%)'}`,
          }}
        >
          {/* Icon Container - matching StatCard style */}
          <div 
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
            style={{
               background: `linear-gradient(135deg, color-mix(in srgb, ${visibleIconColor} 8.2%, transparent), transparent)`,
               border: `1px solid color-mix(in srgb, ${visibleIconColor} 14.5%, transparent)`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: visibleIconColor }} />
          </div>

          <div className="flex-1 overflow-hidden">
            <h4 
              className="font-bold text-[14px] transition-colors truncate" 
              style={{ color: textColor }}
            >
              {title}
            </h4>
            <p 
              className="text-[11px] mt-0.5 truncate opacity-70" 
              style={{ color: mutedTextColor }}
            >
              {description}
            </p>
          </div>

          {/* Arrow Indicator */}
          <div 
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0" 
            style={{ color: visibleIconColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Subtle glow effect */}
          <div 
            className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[30px] opacity-0 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-10"
            style={{ backgroundColor: visibleIconColor }}
          />
        </div>
      </PrefetchLink>
    </motion.div>
  )
}
