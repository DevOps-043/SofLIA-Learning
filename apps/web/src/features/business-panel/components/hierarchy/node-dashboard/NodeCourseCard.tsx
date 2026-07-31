'use client'

import { UserCheck } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

type NodeCourse = NonNullable<NodeDashboardCommonProps['state']['data']>['courses'][number]

export function NodeCourseCard({ course, state, t }: NodeDashboardCommonProps & { course: NodeCourse }) {
  return (
    <article className={styles.courseCard}>
      <div className={styles.courseImage}>
        {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" /> : null}
        {course.category ? <span className={styles.courseCategory}>{course.category}</span> : null}
      </div>
      <div className={styles.courseBody}>
        <h3 className={styles.courseTitle}>{course.title}</h3>
        <footer className={styles.courseFooter}>
          <span className={`${styles.statusBadge} ${course.status === 'active' ? styles.statusActive : ''}`}>
            {course.status === 'active' ? t('hierarchy.dashboard.details.status.active') : t('hierarchy.dashboard.details.status.inactive')}
          </span>
          <button
            type="button"
            onClick={() => state.setSelectedCourseForIndividual({ id: course.id, title: course.title })}
            className={styles.iconButton}
            aria-label={`${t('hierarchy.dashboard.learning.individualAssign')}: ${course.title}`}
          >
            <UserCheck aria-hidden="true" />
          </button>
        </footer>
      </div>
    </article>
  )
}
