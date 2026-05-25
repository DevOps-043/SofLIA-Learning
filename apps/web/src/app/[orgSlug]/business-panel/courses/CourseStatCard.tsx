'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

export interface CourseStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  delay: number
}

export function CourseStatCard({ title, value, icon: Icon, color, delay }: CourseStatCardProps) {
  const { isDark, textColor, subtextColor, cardBg, borderColor } = useBusinessPanelTheme()
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const iconColor = isDark ? color : textColor
  const entranceDelay = disableHeavy ? 0 : Math.min(delay * interfaceStaggerSeconds, 0.08)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      whileHover={disableHeavy ? undefined : { y: -2, transition: interfaceTransition }}
      className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px] border"
      style={{
        backgroundColor: cardBg,
        backdropFilter: 'blur(20px)',
        borderColor,
        boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.4)' : '0 4px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Sleek icon wrapper */}
        <div 
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
             background: `linear-gradient(135deg, color-mix(in srgb, ${iconColor} 8.2%, transparent), transparent)`,
             border: `1px solid color-mix(in srgb, ${iconColor} 14.5%, transparent)`
          }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center overflow-hidden">
          <p 
            className="text-[10px] uppercase tracking-widest font-bold mb-1 truncate w-full" 
            style={{ color: subtextColor, opacity: 0.9 }}
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
        style={{ backgroundColor: iconColor }}
      />
      
      {/* Subtle accent bar matching dashboard pattern */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] rounded-r-full group-hover:w-1/2 transition-all duration-700 opacity-60"
        style={{ width: '20%', backgroundColor: iconColor }}
      />
    </motion.div>
  )
}
