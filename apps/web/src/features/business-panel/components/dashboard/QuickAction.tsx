'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'

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
  
  const panelStyles = effectiveStyles?.panel
  const textColor = isLightMode ? (panelStyles?.text_color || '#0F172A') : (panelStyles?.text_color || '#FFFFFF')
  const iconColor = color || '#00D4B3'

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
          className="group relative overflow-hidden rounded-[16px] p-4 transition-all duration-300 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md"
          style={{
            backgroundColor: isLightMode ? '#FFFFFF' : 'rgba(15, 20, 25, 0.6)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.04)'}`,
          }}
        >
          {/* Icon Container - matching StatCard style */}
          <div 
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
            style={{
               background: `linear-gradient(135deg, ${iconColor}15, transparent)`,
               border: `1px solid ${iconColor}25`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
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
              style={{ color: isLightMode ? '#64748B' : '#858E9B' }}
            >
              {description}
            </p>
          </div>

          {/* Arrow Indicator */}
          <div 
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-3 group-hover:translate-x-0" 
            style={{ color: iconColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Subtle glow effect */}
          <div 
            className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[30px] opacity-0 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-10"
            style={{ backgroundColor: iconColor }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

