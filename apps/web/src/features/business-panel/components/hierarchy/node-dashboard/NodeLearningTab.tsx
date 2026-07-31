'use client'

import { BookOpen, Plus } from 'lucide-react'
import { NodeCourseCard } from './NodeCourseCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeLearningTab(props: NodeDashboardCommonProps) {
  const { state, t } = props
  const courses = state.data?.courses || []
  return (
    <div className={styles.settingsStack}>
      <header className={styles.sectionToolbar}>
        <div className={styles.sectionToolbarCopy}>
          <h2>{t('hierarchy.dashboard.learning.title')}</h2>
          <p>{t('hierarchy.dashboard.learning.subtitle')}</p>
        </div>
        <button type="button" onClick={() => state.setShowAssignmentModal(true)} className={styles.primaryButton}>
          <Plus aria-hidden="true" />
          {t('hierarchy.dashboard.learning.assign')}
        </button>
      </header>
      {courses.length === 0 ? (
        <div className={styles.emptySurface}>
          <BookOpen aria-hidden="true" />
          <h3>{t('hierarchy.dashboard.learning.title')}</h3>
          <p>{t('hierarchy.dashboard.learning.empty')}</p>
          <button type="button" onClick={() => state.setShowAssignmentModal(true)} className={styles.secondaryButton}>
            <Plus aria-hidden="true" />
            {t('hierarchy.dashboard.learning.assign')}
          </button>
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {courses.map(course => <NodeCourseCard key={course.assignment_id} {...props} course={course} />)}
          <button type="button" onClick={() => state.setShowAssignmentModal(true)} className={styles.courseAdd}>
            <span className={styles.courseAddIcon}><Plus aria-hidden="true" /></span>
            {t('hierarchy.dashboard.learning.assignNew')}
          </button>
        </div>
      )}
    </div>
  )
}
