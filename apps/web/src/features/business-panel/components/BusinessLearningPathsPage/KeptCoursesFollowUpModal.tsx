'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { KeptCourseWithProgress } from '@/features/admin/services/admin-learning-paths/course-access-provenance-cleanup.service'
import type { BusinessLearningPathsTheme } from './types'

interface KeptCoursesFollowUpModalProps {
  isOpen: boolean
  onClose: () => void
  revokedCount: number
  keptWithProgress: KeptCourseWithProgress[]
  isSubmitting: boolean
  onForceRevoke: (courseIds: string[]) => Promise<void>
  theme: BusinessLearningPathsTheme
}

export function KeptCoursesFollowUpModal({
  isOpen,
  onClose,
  revokedCount,
  keptWithProgress,
  isSubmitting,
  onForceRevoke,
  theme,
}: KeptCoursesFollowUpModalProps) {
  const { t } = useTranslation('business')
  const { textColor, mutedTextColor, borderColor, panelBg, inputBg, dangerColor } = theme
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (courseId: string) => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const handleClose = () => {
    setSelected(new Set())
    onClose()
  }

  const handleForceRevoke = async () => {
    if (selected.size === 0) return
    await onForceRevoke([...selected])
    setSelected(new Set())
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border flex flex-col"
            style={{ borderColor, backgroundColor: panelBg }}
          >
            <div className="p-6 border-b" style={{ borderColor }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-black" style={{ color: textColor }}>
                    {t('learningPathsPage.keptCoursesModal.title', { defaultValue: 'Cursos con progreso' })}
                  </h4>
                  <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
                    {revokedCount > 0
                      ? t('learningPathsPage.keptCoursesModal.descriptionWithRevoked', {
                          defaultValue: `Se revocó automáticamente el acceso a ${revokedCount} curso(s) sin progreso. Los siguientes se mantuvieron porque el usuario ya avanzó en ellos.`,
                          count: revokedCount,
                        })
                      : t('learningPathsPage.keptCoursesModal.description', {
                          defaultValue: 'Los siguientes cursos se mantuvieron asignados porque el usuario ya avanzó en ellos.',
                        })}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="shrink-0 p-2 rounded-xl transition-all hover:opacity-70"
                  style={{ color: mutedTextColor }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-6 space-y-3">
              {keptWithProgress.map((course) => (
                <label
                  key={course.courseId}
                  className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer"
                  style={{ borderColor, backgroundColor: inputBg }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(course.courseId)}
                    onChange={() => toggle(course.courseId)}
                    className="h-4 w-4 shrink-0 rounded"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: textColor }}>
                      {course.courseTitle || 'Curso'}
                    </p>
                    <p className="text-xs" style={{ color: mutedTextColor }}>
                      {course.progressPercentage}% de progreso
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="px-6 pb-4 flex items-center gap-2 text-xs" style={{ color: dangerColor }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {t('learningPathsPage.keptCoursesModal.warning', {
                  defaultValue: 'También revocar un curso seleccionado eliminará el progreso registrado del usuario en él.',
                })}
              </span>
            </div>

            <div className="p-6 border-t flex items-center justify-end gap-3" style={{ borderColor }}>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-70"
                style={{ color: mutedTextColor }}
              >
                {t('learningPathsPage.keptCoursesModal.accept', { defaultValue: 'Aceptar' })}
              </button>
              <button
                onClick={() => void handleForceRevoke()}
                disabled={selected.size === 0 || isSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: dangerColor }}
              >
                {isSubmitting
                  ? t('learningPathsPage.keptCoursesModal.revoking', { defaultValue: 'Revocando…' })
                  : t('learningPathsPage.keptCoursesModal.revokeSelected', {
                      defaultValue: `Revocar seleccionados (${selected.size})`,
                      count: selected.size,
                    })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
