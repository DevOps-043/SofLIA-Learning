'use client'

import { motion } from 'framer-motion'
import { BookOpen, Calendar, Clock, Sparkles, Users } from 'lucide-react'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessUser } from '../../services/businessUsers.service'
import { getBusinessAssignCourseDisplayName } from './service'
import type { BusinessAssignCourseCopyProps } from './types'

interface BusinessAssignCoursePreviewPanelProps extends BusinessAssignCourseCopyProps {
  courseTitle: string
  dueDate: string
  selectedUsers: BusinessUser[]
  selectedUserCount: number
  availableUserCount: number
}

export function BusinessAssignCoursePreviewPanel({
  courseTitle,
  dueDate,
  selectedUsers,
  selectedUserCount,
  availableUserCount,
  t,
}: BusinessAssignCoursePreviewPanelProps) {
  const theme = useBusinessPanelTheme()
  const { disableHeavy } = useMotionSafe()
  const progressPercent = availableUserCount > 0
    ? (selectedUserCount / availableUserCount) * 100
    : 0

  return (
    <div
      className="relative hidden w-80 flex-shrink-0 overflow-hidden border-r p-10 xl:flex xl:flex-col"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-32 w-32 blur-[100px] opacity-20"
        style={{ backgroundColor: theme.primaryColor }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-10"
      >
        <div
          className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem]"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
            boxShadow: `0 20px 40px color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)`,
          }}
        >
          <BookOpen className="h-10 w-10" style={{ color: theme.onPrimaryColor }} />

          <motion.div
            animate={disableHeavy ? {} : { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -right-3 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-2xl shadow-xl"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Sparkles className="h-5 w-5" style={{ color: theme.onPrimaryColor }} />
          </motion.div>
        </div>
      </motion.div>

      <div className="mb-10 text-center">
        <h3 className="mb-3 text-xl font-black uppercase tracking-widest" style={{ color: theme.textColor }}>
          {t('assignCourse.title')}
        </h3>
        <p className="text-sm font-medium leading-relaxed" style={{ color: theme.subtextColor }}>
          {courseTitle}
        </p>
      </div>

      <div className="space-y-6">
        <div
          className="rounded-[2rem] border p-6 shadow-inner"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: theme.primaryColor }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
                {t('assignCourse.stats.selected')}
              </span>
            </div>
            <span className="text-2xl font-black" style={{ color: theme.primaryColor }}>
              {selectedUserCount}
            </span>
          </div>

          <div
            className="mb-3 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: theme.hoverBg }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </div>

          <div
            className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-40"
            style={{ color: theme.textColor }}
          >
            <span>0</span>
            <span>{availableUserCount} disponibles</span>
          </div>
        </div>

        {selectedUserCount > 0 ? (
          <div className="pt-4">
            <p
              className="mb-4 text-[10px] font-black uppercase tracking-widest opacity-50"
              style={{ color: theme.textColor }}
            >
              {t('assignCourse.stats.usersSelected')}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.slice(0, 7).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl border-2 text-xs font-black"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.onPrimaryColor,
                    borderColor: theme.panelBg,
                  }}
                >
                  {getBusinessAssignCourseDisplayName(user)[0].toUpperCase()}
                </motion.div>
              ))}
              {selectedUserCount > 7 ? (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl border text-[10px] font-black"
                  style={{
                    backgroundColor: theme.hoverBg,
                    color: theme.textColor,
                    borderColor: theme.borderColor,
                  }}
                >
                  +{selectedUserCount - 7}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-auto border-t pt-8" style={{ borderColor: theme.borderColor }}>
        {dueDate ? (
          <div
            className="flex items-center gap-3 rounded-[1.5rem] border p-4"
            style={{ backgroundColor: `color-mix(in srgb, ${theme.accentColor} 6.3%, transparent)`, borderColor: `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)` }}
          >
            <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: theme.accentColor }} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.accentColor }}>
                Fecha límite
              </span>
              <span className="text-sm font-bold" style={{ color: theme.textColor }}>
                {new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4" style={{ color: theme.mutedTextColor }}>
            <Clock className="h-5 w-5" style={{ color: theme.textColor }} />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t('assignCourse.labels.noDueDate', 'Sin fecha límite')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
