'use client'

import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

// ============================================
// COMPONENTE: StatCard Premium (Match Dashboard)
// ============================================
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  delay: number
  trend?: number
  isDark?: boolean
  onClick?: () => void
  accentColor?: string
  primaryColor?: string
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  delay, 
  trend = 0, 
  isDark, 
  onClick, 
  accentColor = '#00D4B3', 
  primaryColor = '#0A2540' 
}: StatCardProps) {
  const isPositive = trend >= 0
  const iconColor = isDark ? accentColor : primaryColor
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const subTextColor = isDark ? '#858E9B' : '#475569'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px] cursor-pointer"
      style={{
        backgroundColor: isDark ? 'rgba(15, 20, 25, 0.6)' : '#FFFFFF',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)'}`,
        boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.4)' : '0 4px 20px -10px rgba(0,0,0,0.05)',
      }}
      onClick={onClick}
    >
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Sleek icon wrapper */}
        <div 
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[14px] transition-transform duration-500 group-hover:scale-[1.05]"
          style={{
             background: `linear-gradient(135deg, ${iconColor}15, transparent)`,
             border: `1px solid ${iconColor}25`
          }}
        >
          <div className="w-5 h-5 flex items-center justify-center" style={{ color: iconColor }}>
            {icon}
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
             <p 
               className="text-[10px] uppercase tracking-widest font-bold truncate" 
               style={{ color: subTextColor, opacity: 0.9 }}
             >
               {title}
             </p>
             {trend !== 0 && (
                <div className={`flex items-center text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                   {isPositive ? '+' : ''}{trend}%
                </div>
             )}
          </div>
          <p 
            className="text-2xl font-extrabold leading-none tracking-tight truncate w-full" 
            style={{ color: textColor }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>

      {/* Subtle modern abstract glow */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-40 group-hover:scale-110"
        style={{ backgroundColor: iconColor }}
      />
      
      {/* Bottom accent line on hover */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: iconColor }}
        initial={{ width: 0 }}
        whileHover={{ width: '40%' }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  )
}

export { StatCard }
export type { StatCardProps }


