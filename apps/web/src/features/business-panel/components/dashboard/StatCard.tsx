'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'

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
  icon?: ComponentType<{ className?: string, style?: React.CSSProperties }>
}

export function StatCard({ title, value, delay, href, id, theme, gradientStyle, icon: Icon = ChartBarIcon }: StatCardProps) {
  const primaryColor = theme?.cardBg || 'var(--color-primary)'
  const accentColor = gradientStyle?.background ? String(gradientStyle.background).split(',')[1]?.trim() || 'var(--color-accent)' : 'var(--color-accent)'
  const actualAccentColor = accentColor.length === 7 || accentColor.length === 9 || accentColor.startsWith('#') ? accentColor : 'var(--color-accent)'
  
  const isLightMode = primaryColor.toLowerCase() === 'var(--color-bg-light)' ||
    primaryColor.toLowerCase() === 'var(--color-gray-50)' ||
    primaryColor.startsWith('rgb(255') ||
    primaryColor === '#FFFFFF' ||
    primaryColor === '#ffffff'
  
  const textColor = theme?.text || (isLightMode ? '#0F172A' : '#FFFFFF')
  const iconColor = isLightMode ? 'var(--color-primary)' : actualAccentColor

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-start min-h-[90px]"
      id={id}
      style={{
        backgroundColor: isLightMode ? 'var(--color-bg-light)' : 'rgb(15 20 25 / 60%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isLightMode ? 'var(--color-gray-200)' : 'rgb(255 255 255 / 4%)'}`,
        boxShadow: isLightMode ? '0 4px 20px -10px rgb(0 0 0 / 5%)' : '0 10px 30px -10px rgb(0 0 0 / 40%)',
      }}
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
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center overflow-hidden">
          <p 
            className="text-[10px] uppercase tracking-widest font-bold mb-1 truncate w-full" 
            style={{ color: isLightMode ? 'var(--color-gray-500)' : 'var(--color-gray-400)', opacity: 0.9 }}
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
    </motion.div>
  )

  if (href) return <Link href={href} className="block w-full">{CardContent}</Link>
  return CardContent
}
