'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import type { TFunction } from 'i18next'
import type { LearningPath, OrganizationLearningPathAssignment } from '../courses-section.types'
import { colors } from '../courses-section.types'

interface LearningPathCatalogCardProps {
  path: LearningPath
  activeAssignments: OrganizationLearningPathAssignment[]
  assigningId: string | null
  onAssign: (learningPathId: string) => void
  t: TFunction<'admin'>
}

export function LearningPathCatalogCard({
  path,
  activeAssignments,
  assigningId,
  onAssign,
  t,
}: LearningPathCatalogCardProps) {
  const isAlreadyAssigned = activeAssignments.some(
    assignment => assignment.learning_path_id === path.id && assignment.status === 'active',
  )

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group rounded-3xl overflow-hidden border transition-all flex flex-col border-gray-200 bg-white dark:border-white/5 dark:bg-carbon-900"
    >
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{t('coursesSection.sequentialPath')}</p>
        <h5 className="text-lg font-bold leading-tight mb-2 text-gray-900 dark:text-white">{path.title}</h5>
        <p className="text-sm line-clamp-3 mb-6 text-gray-500 dark:text-white/60">
          {path.description || t('coursesSection.noDescription')}
        </p>
        <div className="text-[11px] font-medium mb-6 text-gray-500 dark:text-white/60">
          {t('coursesSection.workshopsInSequence', { count: path.item_count })}
        </div>
        <div className="mt-auto pt-6 border-t flex items-center justify-between border-gray-100 dark:border-white/5">
          {isAlreadyAssigned ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{t('coursesSection.alreadyAssigned')}</span>
            </div>
          ) : (
            <button
              disabled={!!assigningId}
              onClick={() => onAssign(path.id)}
              className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
              {assigningId === path.id ? t('coursesSection.processing') : t('coursesSection.assignPath')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
