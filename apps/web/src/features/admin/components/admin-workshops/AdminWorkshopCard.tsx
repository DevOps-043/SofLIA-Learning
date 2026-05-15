'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Clock,
  Eye,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import {
  formatWorkshopDuration,
  getAdminWorkshopCategoryConfig,
  getAdminWorkshopLevelConfig,
  getAdminWorkshopStatusConfig,
  getWorkshopInstructorInitials,
} from './admin-workshops-display.service'
import { WorkshopThumbnail } from './WorkshopThumbnail'
import { useMotionSafe } from '@/lib/utils/motion'

interface AdminWorkshopCardProps {
  workshop: AdminWorkshop
  index: number
  onView: (workshop: AdminWorkshop) => void
  onEdit: (workshop: AdminWorkshop) => void
  onDelete: (workshop: AdminWorkshop) => void
}

export function AdminWorkshopCard({
  workshop,
  index,
  onView,
  onEdit,
  onDelete,
}: AdminWorkshopCardProps) {
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const { disableHeavy, safeTransition } = useMotionSafe()
  const [instructorImageError, setInstructorImageError] = useState(false)
  const categoryConfig = getAdminWorkshopCategoryConfig(workshop.category, theme)
  const levelConfig = getAdminWorkshopLevelConfig(workshop.level, theme)
  const statusConfig = getAdminWorkshopStatusConfig(workshop.is_active, theme)
  const instructorInitials = getWorkshopInstructorInitials(
    workshop.instructor_name,
  )
  const categoryLabel = tc(
    `common.categories.${workshop.category}`,
    workshop.category,
  )
  const levelLabel = levelConfig.labelKey
    ? ta(levelConfig.labelKey)
    : levelConfig.fallbackLabel
  const statusLabel = statusConfig.labelKey
    ? ta(statusConfig.labelKey)
    : statusConfig.fallbackLabel

  return (
    <motion.div
      variants={disableHeavy ? undefined : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: 'easeOut' },
        },
      }}
      whileHover={disableHeavy ? undefined : { y: -8, scale: 1.02 }}
      transition={disableHeavy ? safeTransition : { type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onView(workshop)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-2xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="group/image relative h-56 flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: theme.inputBg }}
      >
        <WorkshopThumbnail
          thumbnailUrl={workshop.thumbnail_url}
          title={workshop.title}
        />
        <div
          className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.18), transparent)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-t-2xl border-2 border-transparent transition-all duration-500 group-hover:opacity-100"
          style={{ borderColor: 'transparent' }}
        />
        <motion.div
          initial={disableHeavy ? false : { scale: 0, rotate: -180 }}
          animate={disableHeavy ? undefined : { scale: 1, rotate: 0 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05, type: 'spring', stiffness: 200 }}
          className="absolute top-4 right-4 z-10"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
              color: statusConfig.color,
            }}
          >
            <div
              className={workshop.is_active ? 'h-1.5 w-1.5 animate-pulse rounded-full' : 'h-1.5 w-1.5 rounded-full'}
              style={{ backgroundColor: statusConfig.color }}
            />
            {statusLabel}
          </span>
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-10">
          <motion.span
            initial={disableHeavy ? false : { x: -30, opacity: 0 }}
            animate={disableHeavy ? undefined : { x: 0, opacity: 1 }}
            transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.1, type: 'spring' }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: categoryConfig.bg,
              borderColor: categoryConfig.border,
              color: categoryConfig.color,
            }}
          >
            {categoryLabel}
          </motion.span>
          <motion.span
            initial={disableHeavy ? false : { x: -30, opacity: 0 }}
            animate={disableHeavy ? undefined : { x: 0, opacity: 1 }}
            transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.15, type: 'spring' }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: levelConfig.bg,
              borderColor: levelConfig.border,
              color: levelConfig.color,
            }}
          >
            {levelLabel}
          </motion.span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <motion.h3
          initial={disableHeavy ? false : { opacity: 0 }}
          animate={disableHeavy ? undefined : { opacity: 1 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.2 }}
          className="mb-3 line-clamp-2 min-h-[3.5rem] text-xl font-bold transition-colors duration-300"
          style={{ color: theme.textColor }}
        >
          {workshop.title}
        </motion.h3>

        <motion.p
          initial={disableHeavy ? false : { opacity: 0 }}
          animate={disableHeavy ? undefined : { opacity: 1 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.25 }}
          className="mb-5 line-clamp-2 min-h-[2.5rem] flex-1 text-sm leading-relaxed"
          style={{ color: theme.subtextColor }}
        >
          {workshop.description}
        </motion.p>

        <motion.div
          initial={disableHeavy ? false : { opacity: 0, y: 10 }}
          animate={disableHeavy ? undefined : { opacity: 1, y: 0 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.3 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {workshop.instructor_profile_picture_url && !instructorImageError ? (
              <div
                className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2"
                style={{ '--tw-ring-color': `${theme.accentColor}33` } as CSSProperties}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})`,
                    color: theme.onPrimaryColor,
                  }}
                >
                  {instructorInitials}
                </div>
                <Image
                  src={workshop.instructor_profile_picture_url}
                  alt={workshop.instructor_name || ta('workshops.card.instructorLabel')}
                  fill
                  sizes="40px"
                  className="relative z-10 object-cover"
                  onError={() => setInstructorImageError(true)}
                />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2"
                style={{
                  '--tw-ring-color': `${theme.accentColor}33`,
                  background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})`,
                  color: theme.onPrimaryColor,
                } as CSSProperties}
              >
                {instructorInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="mb-0.5 text-xs uppercase tracking-wide"
                style={{ color: theme.mutedTextColor }}
              >
                {ta('workshops.card.instructorLabel')}
              </p>
              <p
                className="truncate text-sm font-semibold"
                style={{ color: theme.textColor }}
              >
                {workshop.instructor_name || ta('workshops.card.noInstructor')}
              </p>
            </div>
          </div>
          <div
            className="ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Clock className="h-4 w-4" style={{ color: theme.subtextColor }} />
            <span
              className="text-sm font-medium"
              style={{ color: theme.textColor }}
            >
              {formatWorkshopDuration(workshop.duration_total_minutes)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={disableHeavy ? false : { opacity: 0, y: 10 }}
          animate={disableHeavy ? undefined : { opacity: 1, y: 0 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.35 }}
          className="mt-auto flex items-center justify-between border-t pt-5"
          style={{ borderColor: theme.dividerColor }}
        >
          <motion.div
            whileHover={disableHeavy ? undefined : { scale: 1.05 }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Users className="h-4 w-4" style={{ color: theme.accentColor }} />
            <span
              className="text-sm font-semibold"
              style={{ color: theme.textColor }}
            >
              {workshop.student_count || 0}{' '}
              <span
                className="text-xs font-normal"
                style={{ color: theme.subtextColor }}
              >
                {ta('workshops.card.studentsLabel')}
              </span>
            </span>
          </motion.div>
          <div
            className="flex items-center gap-2 rounded-xl border p-1.5"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
            }}
          >
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.stopPropagation()
                onView(workshop)
              }}
              className="rounded-lg p-2.5 transition-all duration-300"
              style={{ color: theme.subtextColor }}
              title={tc('actions.viewDetails')}
              type="button"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(workshop)
              }}
              className="rounded-lg p-2.5 transition-all duration-300"
              style={{ color: theme.successColor }}
              title={tc('actions.edit')}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onDelete(workshop)
              }}
              className="rounded-lg p-2.5 transition-all duration-300"
              style={{ color: theme.dangerColor }}
              title={tc('actions.delete')}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
