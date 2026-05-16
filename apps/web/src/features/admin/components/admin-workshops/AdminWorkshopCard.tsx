'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import { formatWorkshopDuration, getAdminWorkshopCategoryConfig, getAdminWorkshopLevelConfig, getAdminWorkshopStatusConfig, getWorkshopInstructorInitials } from './admin-workshops-display.service'
import { AdminWorkshopCardFooter } from './AdminWorkshopCardFooter'
import { AdminWorkshopCardInstructor } from './AdminWorkshopCardInstructor'
import { AdminWorkshopCardMedia } from './AdminWorkshopCardMedia'
import { useMotionSafe } from '@/lib/utils/motion'

interface AdminWorkshopCardProps {
  workshop: AdminWorkshop
  index: number
  onView: (workshop: AdminWorkshop) => void
  onEdit: (workshop: AdminWorkshop) => void
  onDelete: (workshop: AdminWorkshop) => void
}

export function AdminWorkshopCard({ workshop, index, onView, onEdit, onDelete }: AdminWorkshopCardProps) {
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const { disableHeavy, safeTransition } = useMotionSafe()
  const categoryConfig = getAdminWorkshopCategoryConfig(workshop.category, theme)
  const levelConfig = getAdminWorkshopLevelConfig(workshop.level, theme)
  const statusConfig = getAdminWorkshopStatusConfig(workshop.is_active, theme)
  const instructorInitials = getWorkshopInstructorInitials(workshop.instructor_name)
  const categoryLabel = tc(`common.categories.${workshop.category}`, workshop.category)
  const levelLabel = levelConfig.labelKey ? ta(levelConfig.labelKey) : levelConfig.fallbackLabel
  const statusLabel = statusConfig.labelKey ? ta(statusConfig.labelKey) : statusConfig.fallbackLabel

  return (
    <motion.div variants={disableHeavy ? undefined : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }} whileHover={disableHeavy ? undefined : { y: -8, scale: 1.02 }} transition={disableHeavy ? safeTransition : { type: 'spring', stiffness: 300, damping: 20 }} onClick={() => onView(workshop)} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <AdminWorkshopCardMedia title={workshop.title} thumbnailUrl={workshop.thumbnail_url} isActive={workshop.is_active} categoryLabel={categoryLabel} levelLabel={levelLabel} statusLabel={statusLabel} categoryConfig={categoryConfig} levelConfig={levelConfig} statusConfig={statusConfig} index={index} />
      <div className="flex flex-1 flex-col p-6">
        <motion.h3 initial={disableHeavy ? false : { opacity: 0 }} animate={disableHeavy ? undefined : { opacity: 1 }} transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.2 }} className="mb-3 line-clamp-2 min-h-[3.5rem] text-xl font-bold transition-colors duration-300" style={{ color: theme.textColor }}>{workshop.title}</motion.h3>
        <motion.p initial={disableHeavy ? false : { opacity: 0 }} animate={disableHeavy ? undefined : { opacity: 1 }} transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.25 }} className="mb-5 line-clamp-2 min-h-[2.5rem] flex-1 text-sm leading-relaxed" style={{ color: theme.subtextColor }}>{workshop.description}</motion.p>
        <AdminWorkshopCardInstructor instructorName={workshop.instructor_name} instructorImageUrl={workshop.instructor_profile_picture_url} instructorInitials={instructorInitials} durationLabel={formatWorkshopDuration(workshop.duration_total_minutes)} index={index} />
        <AdminWorkshopCardFooter studentCount={workshop.student_count || 0} index={index} onView={() => onView(workshop)} onEdit={() => onEdit(workshop)} onDelete={() => onDelete(workshop)} />
      </div>
    </motion.div>
  )
}
