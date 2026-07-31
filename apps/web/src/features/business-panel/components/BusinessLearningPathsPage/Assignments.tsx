import { AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessLearningPathAssignmentRow } from './AssignmentRow'
import type { BusinessLearningPathsLogic } from './types'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

interface BusinessLearningPathAssignmentsProps {
  logic: BusinessLearningPathsLogic
  language: string
}

export function BusinessLearningPathAssignments({ logic, language }: BusinessLearningPathAssignmentsProps) {
  const { t } = useTranslation('business')
  const assignmentCards = logic.assignments.slice().sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
  return (
    <section id="tour-paths-assignments" className={styles.assignmentsSection}>
      <header className={styles.assignmentsHeader}>
        <h2>{t('learningPathsPage.assignmentsTitle')}</h2>
        <p>{t('learningPathsPage.assignmentsDescription')}</p>
      </header>
      {assignmentCards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Users />
            </span>
            <h3>{t('learningPathsPage.noAssignmentsTitle')}</h3>
            <p>{t('learningPathsPage.noAssignmentsDescription')}</p>
          </div>
        </div>
      ) : (
        <div className={styles.assignmentTable}>
          <div className={styles.assignmentTableHeader}>
            {[t('learningPathsPage.columns.user'), t('learningPathsPage.columns.learningPath'), t('learningPathsPage.columns.assignedAt'), 'Acción'].map((heading, index) => (
              <span key={`${heading}-${index}`}>{heading}</span>
            ))}
          </div>
          <AnimatePresence>
            {assignmentCards.map((assignment, index) => (
              <BusinessLearningPathAssignmentRow key={assignment.id} assignment={assignment} index={index} language={language} logic={logic} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
