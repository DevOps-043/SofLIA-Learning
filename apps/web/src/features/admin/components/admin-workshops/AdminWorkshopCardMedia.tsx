'use client'

import { motion } from 'framer-motion'
import { WorkshopThumbnail } from './WorkshopThumbnail'
import { useMotionSafe } from '@/lib/utils/motion'
import type { AdminWorkshopBadgeConfig } from './admin-workshops-display.service'

interface AdminWorkshopCardMediaProps {
  title: string
  thumbnailUrl?: string
  isActive: boolean
  categoryLabel: string
  levelLabel: string
  statusLabel: string
  categoryConfig: AdminWorkshopBadgeConfig
  levelConfig: AdminWorkshopBadgeConfig
  statusConfig: AdminWorkshopBadgeConfig
  index: number
}

export function AdminWorkshopCardMedia(props: AdminWorkshopCardMediaProps) {
  const { disableHeavy } = useMotionSafe()
  return (
    <div className="group/image relative h-56 flex-shrink-0 overflow-hidden bg-[var(--color-gray-100)]">
      <WorkshopThumbnail thumbnailUrl={props.thumbnailUrl} title={props.title} />
      <div className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-80" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.18), transparent)' }} />
      <div className="pointer-events-none absolute inset-0 rounded-t-2xl border-2 border-transparent transition-all duration-500 group-hover:opacity-100" style={{ borderColor: 'transparent' }} />
      <motion.div initial={disableHeavy ? false : { scale: 0, rotate: -180 }} animate={disableHeavy ? undefined : { scale: 1, rotate: 0 }} transition={disableHeavy ? undefined : { delay: props.index * 0.05, type: 'spring', stiffness: 200 }} className="absolute right-4 top-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md" style={{ backgroundColor: props.statusConfig.bg, borderColor: props.statusConfig.border, color: props.statusConfig.color }}>
          <div className={props.isActive ? 'h-1.5 w-1.5 animate-pulse rounded-full' : 'h-1.5 w-1.5 rounded-full'} style={{ backgroundColor: props.statusConfig.color }} />
          {props.statusLabel}
        </span>
      </motion.div>
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2">
        <AdminWorkshopCardBadge delay={props.index * 0.05 + 0.1} label={props.categoryLabel} config={props.categoryConfig} />
        <AdminWorkshopCardBadge delay={props.index * 0.05 + 0.15} label={props.levelLabel} config={props.levelConfig} />
      </div>
    </div>
  )
}

function AdminWorkshopCardBadge({
  delay,
  label,
  config,
}: {
  delay: number
  label: string
  config: AdminWorkshopBadgeConfig
}) {
  const { disableHeavy } = useMotionSafe()
  return (
    <motion.span initial={disableHeavy ? false : { x: -30, opacity: 0 }} animate={disableHeavy ? undefined : { x: 0, opacity: 1 }} transition={disableHeavy ? undefined : { delay, type: 'spring' }} className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md" style={{ backgroundColor: config.bg, borderColor: config.border, color: config.color }}>
      {label}
    </motion.span>
  )
}
