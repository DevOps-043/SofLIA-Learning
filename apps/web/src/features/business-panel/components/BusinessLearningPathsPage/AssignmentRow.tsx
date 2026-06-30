import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/date-formatter'
import { getUserDisplayName } from './format'
import type { BusinessLearningPathAssignment, BusinessLearningPathsLogic } from './types'

interface BusinessLearningPathAssignmentRowProps {
  assignment: BusinessLearningPathAssignment
  index: number
  language: string
  logic: BusinessLearningPathsLogic
}

export function BusinessLearningPathAssignmentRow({ assignment, index, language, logic }: BusinessLearningPathAssignmentRowProps) {
  const { t } = useTranslation('business')
  const { textColor, mutedTextColor, borderColor, dangerColor } = logic.theme
  return (
    <motion.div
      layout
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1fr_1fr_130px_auto] md:items-center md:gap-4 md:px-6 md:py-4"
      style={{ borderTop: `1px solid ${index === 0 ? 'transparent' : borderColor}` }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: textColor }}>{getUserDisplayName(assignment.user) || t('learningPathsPage.unnamedUser')}</p>
        <p className="text-xs truncate" style={{ color: mutedTextColor }}>{assignment.user?.email}</p>
      </div>
      <p className="text-sm truncate font-medium" style={{ color: textColor }}>{assignment.learning_path?.title ?? assignment.learning_path_id}</p>
      <p className="text-xs tabular-nums" style={{ color: mutedTextColor }}>
        {formatDate(assignment.assigned_at, language, { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => void logic.handleRevokeAssignment(assignment.id)}
        disabled={logic.revokingAssignmentId === assignment.id}
        className="inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 md:self-auto"
        style={{ backgroundColor: `color-mix(in srgb, ${dangerColor} 5.1%, transparent)`, borderColor: `color-mix(in srgb, ${dangerColor} 14.5%, transparent)`, color: dangerColor }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {logic.revokingAssignmentId === assignment.id ? t('learningPathsPage.revoking') : t('learningPathsPage.revoke')}
      </motion.button>
    </motion.div>
  )
}
