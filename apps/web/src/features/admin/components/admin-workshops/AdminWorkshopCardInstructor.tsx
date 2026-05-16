'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

interface AdminWorkshopCardInstructorProps {
  instructorName?: string | null
  instructorImageUrl?: string | null
  instructorInitials: string
  durationLabel: string
  index: number
}

export function AdminWorkshopCardInstructor(props: AdminWorkshopCardInstructorProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const { disableHeavy } = useMotionSafe()
  const [imageError, setImageError] = useState(false)
  return (
    <motion.div initial={disableHeavy ? false : { opacity: 0, y: 10 }} animate={disableHeavy ? undefined : { opacity: 1, y: 0 }} transition={disableHeavy ? undefined : { delay: props.index * 0.05 + 0.3 }} className="mb-5 flex items-center justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {props.instructorImageUrl && !imageError ? <AdminWorkshopInstructorAvatar imageUrl={props.instructorImageUrl} initials={props.instructorInitials} name={props.instructorName || t('workshops.card.instructorLabel')} onError={() => setImageError(true)} /> : <AdminWorkshopInstructorFallback initials={props.instructorInitials} />}
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>{t('workshops.card.instructorLabel')}</p>
          <p className="truncate text-sm font-semibold" style={{ color: theme.textColor }}>{props.instructorName || t('workshops.card.noInstructor')}</p>
        </div>
      </div>
      <div className="ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: theme.inputBg }}>
        <Clock className="h-4 w-4" style={{ color: theme.subtextColor }} />
        <span className="text-sm font-medium" style={{ color: theme.textColor }}>{props.durationLabel}</span>
      </div>
    </motion.div>
  )
}

function AdminWorkshopInstructorAvatar(props: {
  imageUrl: string
  initials: string
  name: string
  onError: () => void
}) {
  const theme = useAdminPanelTheme()
  return (
    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2" style={{ '--tw-ring-color': `${theme.accentColor}33` } as CSSProperties}>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})`, color: theme.onPrimaryColor }}>{props.initials}</div>
      <Image src={props.imageUrl} alt={props.name} fill sizes="40px" className="relative z-10 object-cover" onError={props.onError} />
    </div>
  )
}

function AdminWorkshopInstructorFallback({ initials }: { initials: string }) {
  const theme = useAdminPanelTheme()
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2" style={{ '--tw-ring-color': `${theme.accentColor}33`, background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})`, color: theme.onPrimaryColor } as CSSProperties}>
      {initials}
    </div>
  )
}
