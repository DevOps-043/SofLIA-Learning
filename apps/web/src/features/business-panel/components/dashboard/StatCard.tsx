'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface StatCardTheme {
  cardBg?: string
  text?: string
  borderColor?: string
}

export interface StatCardProps {
  title: string
  value: string | number
  change: number
  backgroundImage?: string
  gradient: string
  gradientStyle?: React.CSSProperties
  delay: number
  href?: string
  id?: string
  theme?: StatCardTheme
}

export function StatCard({ title, value, change, backgroundImage, gradient, gradientStyle, delay, href, id, theme }: StatCardProps) {
  const isPositive = change >= 0

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-3xl cursor-pointer h-40 shadow-sm hover:shadow-md transition-shadow duration-300"
      id={id}
      style={{
        backgroundColor: 'var(--org-card-background, #1E2329)',
        border: `1.5px solid ${theme?.borderColor || '#6C757D'}80`,
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 z-0" style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
            style={{ willChange: 'opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            unoptimized={false}
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br transition-all duration-300" style={{ background: `linear-gradient(135deg, ${theme?.cardBg || '#1E2329'}B3, ${theme?.cardBg || '#1E2329'}66, transparent)`, willChange: 'auto', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
          <div className="absolute inset-0 bg-gradient-to-t transition-all duration-300" style={{ background: `linear-gradient(0deg, ${theme?.cardBg || '#1E2329'}CC, transparent, transparent)`, willChange: 'auto', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
        </div>
      )}

      <div className="relative z-10 p-5 h-full flex flex-col justify-between" style={{ willChange: 'auto', transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${theme?.text || '#FFFFFF'}0D`, border: `1px solid ${theme?.borderColor || '#FFFFFF'}1A`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', willChange: 'auto', transform: 'translateZ(0)' }}>
            <div className="w-8 h-1.5 rounded-full" style={gradientStyle} />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isPositive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`} style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', willChange: 'auto', transform: 'translateZ(0)' }}>
            {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-4xl font-black tracking-tight" style={{ color: theme?.text || 'var(--org-text-color, #FFFFFF)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: theme?.text || 'var(--org-text-color, #FFFFFF)', opacity: 0.7, letterSpacing: '0.05em' }}>
            {title}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden" style={{ backgroundColor: `${theme?.text || '#FFFFFF'}0D` }}>
          <div className="h-full rounded-r-full w-[60%]" style={{ background: `linear-gradient(90deg, ${gradientStyle?.background || 'var(--org-accent-color, #00D4B3)'}, transparent)` }} />
        </div>
      </div>
    </motion.div>
  )

  if (href) return <Link href={href}>{CardContent}</Link>
  return CardContent
}
