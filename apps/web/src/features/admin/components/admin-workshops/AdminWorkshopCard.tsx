'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import {
  formatWorkshopDuration,
  getWorkshopCategoryTone,
  getWorkshopInstructorInitials,
  getWorkshopLevelLabel,
  getWorkshopLevelTone,
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
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const { disableHeavy, safeTransition } = useMotionSafe()
  const [instructorImageError, setInstructorImageError] = useState(false)
  const levelTone = getWorkshopLevelTone(workshop.level)
  const categoryTone = getWorkshopCategoryTone(workshop.category)
  const instructorInitials = getWorkshopInstructorInitials(
    workshop.instructor_name,
  )

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
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-500/30 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer"
    >
      <div className="h-56 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-gray-900 dark:to-primary/20 relative overflow-hidden flex-shrink-0 group/image">
        <WorkshopThumbnail
          thumbnailUrl={workshop.thumbnail_url}
          title={workshop.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        <div className="absolute inset-0 border-2 border-accent/0 group-hover:border-accent/50 transition-all duration-500 rounded-t-2xl pointer-events-none" />
        <motion.div
          initial={disableHeavy ? false : { scale: 0, rotate: -180 }}
          animate={disableHeavy ? undefined : { scale: 1, rotate: 0 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05, type: 'spring', stiffness: 200 }}
          className="absolute top-4 right-4 z-10"
        >
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-xl ${
              workshop.is_active
                ? 'bg-success/95 dark:bg-success/40 text-white dark:text-success border-success/50 shadow-success/30'
                : 'bg-gray-500/95 dark:bg-gray-500/40 text-white dark:text-gray-500 border-gray-500/50 shadow-gray-500/30'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                workshop.is_active ? 'bg-white animate-pulse' : 'bg-white/70'
              }`}
            />
            {workshop.is_active ? ta('workshopCard.statusActive') : ta('workshopCard.statusInactive')}
          </span>
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-10">
          <motion.span
            initial={disableHeavy ? false : { x: -30, opacity: 0 }}
            animate={disableHeavy ? undefined : { x: 0, opacity: 1 }}
            transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.1, type: 'spring' }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-lg ${categoryTone.bg} ${categoryTone.text} ${categoryTone.border}`}
          >
            {workshop.category}
          </motion.span>
          <motion.span
            initial={disableHeavy ? false : { x: -30, opacity: 0 }}
            animate={disableHeavy ? undefined : { x: 0, opacity: 1 }}
            transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.15, type: 'spring' }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-lg ${levelTone.bg} ${levelTone.text} ${levelTone.border}`}
          >
            {getWorkshopLevelLabel(workshop.level)}
          </motion.span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <motion.h3
          initial={disableHeavy ? false : { opacity: 0 }}
          animate={disableHeavy ? undefined : { opacity: 1 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.2 }}
          className="text-xl font-bold text-primary dark:text-white mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-accent transition-colors duration-300"
        >
          {workshop.title}
        </motion.h3>

        <motion.p
          initial={disableHeavy ? false : { opacity: 0 }}
          animate={disableHeavy ? undefined : { opacity: 1 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.25 }}
          className="text-sm text-gray-500 dark:text-white/60 mb-5 line-clamp-2 flex-1 min-h-[2.5rem] leading-relaxed"
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
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/20 dark:ring-accent/30 flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent to-primary text-xs font-bold text-white">
                  {instructorInitials}
                </div>
                <Image
                  src={workshop.instructor_profile_picture_url}
                  alt={workshop.instructor_name || ta('workshopCard.instructorLabel')}
                  fill
                  sizes="40px"
                  className="relative z-10 object-cover"
                  onError={() => setInstructorImageError(true)}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-accent/20 dark:ring-accent/30 flex-shrink-0">
                {instructorInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-wide mb-0.5">
                {ta('workshopCard.instructorLabel')}
              </p>
              <p className="text-sm font-semibold text-primary dark:text-white truncate">
                {workshop.instructor_name || ta('workshopCard.noInstructor')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0 px-3 py-1.5 bg-gray-200/50 dark:bg-gray-900 rounded-lg">
            <ClockIcon className="h-4 w-4 text-gray-500 dark:text-white/60" />
            <span className="text-sm font-medium text-primary dark:text-white">
              {formatWorkshopDuration(workshop.duration_total_minutes)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={disableHeavy ? false : { opacity: 0, y: 10 }}
          animate={disableHeavy ? undefined : { opacity: 1, y: 0 }}
          transition={disableHeavy ? undefined : { delay: index * 0.05 + 0.35 }}
          className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-gray-500/30 mt-auto"
        >
          <motion.div
            whileHover={disableHeavy ? undefined : { scale: 1.05 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-200/50 dark:bg-gray-900 rounded-lg"
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-75" />
            </div>
            <span className="text-sm font-semibold text-primary dark:text-white">
              {workshop.student_count || 0}{' '}
              <span className="text-xs font-normal text-gray-500 dark:text-white/60">
                {ta('workshopCard.studentsLabel')}
              </span>
            </span>
          </motion.div>
          <div className="flex items-center gap-2 bg-gray-200/30 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-500/20">
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.stopPropagation()
                onView(workshop)
              }}
              className="relative p-2.5 text-gray-500 dark:text-white/60 hover:text-white hover:bg-accent rounded-lg transition-all duration-300 group/btn"
              title={t('actions.viewDetails')}
            >
              <EyeIcon className="h-4 w-4 relative z-10" />
              <motion.div
                className="absolute inset-0 bg-accent rounded-lg opacity-0 group-hover/btn:opacity-100"
                transition={{ duration: 0.2 }}
              />
            </motion.button>
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(workshop)
              }}
              className="relative p-2.5 text-gray-500 dark:text-white/60 hover:text-white hover:bg-success rounded-lg transition-all duration-300 group/btn"
              title={t('actions.edit')}
            >
              <PencilIcon className="h-4 w-4 relative z-10" />
              <motion.div
                className="absolute inset-0 bg-success rounded-lg opacity-0 group-hover/btn:opacity-100"
                transition={{ duration: 0.2 }}
              />
            </motion.button>
            <motion.button
              whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
              whileTap={disableHeavy ? undefined : { scale: 0.9 }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onDelete(workshop)
              }}
              className="relative p-2.5 text-gray-500 dark:text-white/60 hover:text-white hover:bg-error rounded-lg transition-all duration-300 group/btn"
              title={t('actions.delete')}
              type="button"
            >
              <TrashIcon className="h-4 w-4 relative z-10" />
              <motion.div
                className="absolute inset-0 bg-error rounded-lg opacity-0 group-hover/btn:opacity-100"
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
