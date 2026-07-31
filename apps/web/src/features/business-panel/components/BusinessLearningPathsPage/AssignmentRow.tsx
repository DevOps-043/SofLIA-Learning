import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/date-formatter'
import { getUserDisplayName } from './format'
import type { BusinessLearningPathAssignment, BusinessLearningPathsLogic } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

interface BusinessLearningPathAssignmentRowProps {
  assignment: BusinessLearningPathAssignment
  index: number
  language: string
  logic: BusinessLearningPathsLogic
}

export function BusinessLearningPathAssignmentRow({ assignment, language, logic }: BusinessLearningPathAssignmentRowProps) {
  const { t } = useTranslation('business')
  return (
    <motion.div
      layout
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={styles.assignmentRow}
    >
      <div className={styles.assignmentIdentity}>
        <strong>{getUserDisplayName(assignment.user) || t('learningPathsPage.unnamedUser')}</strong>
        <span>{assignment.user?.email}</span>
      </div>
      <span className={styles.assignmentPath}>{assignment.learning_path?.title ?? assignment.learning_path_id}</span>
      <time className={styles.assignmentDate} dateTime={assignment.assigned_at}>
        {formatDate(assignment.assigned_at, language, { day: 'numeric', month: 'short', year: 'numeric' })}
      </time>
      <button
        type="button"
        onClick={() => void logic.handleRevokeAssignment(assignment.id)}
        disabled={logic.revokingAssignmentId === assignment.id}
        className={styles.dangerAction}
      >
        <Trash2 aria-hidden="true" />
        {logic.revokingAssignmentId === assignment.id ? t('learningPathsPage.revoking') : t('learningPathsPage.revoke')}
      </button>
    </motion.div>
  )
}
