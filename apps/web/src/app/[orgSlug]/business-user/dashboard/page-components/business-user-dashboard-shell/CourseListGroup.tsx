import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'

import { CourseCard3D } from './dynamic-components'
import type { BusinessUserDashboardShellProps, CourseListSection } from './types'
import styles from '../BusinessUserDashboard.module.css'

interface CourseListGroupProps {
  collapsed: boolean
  disableHeavyEffects: boolean
  handleCourseClick: BusinessUserDashboardShellProps['handleCourseClick']
  handleLearningPathCourseClick: BusinessUserDashboardShellProps['handleLearningPathCourseClick']
  interfaceTransition: Transition
  onToggle: () => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  section: CourseListSection
  t: BusinessUserDashboardShellProps['t']
  userDashboardStyles: BusinessUserDashboardShellProps['userDashboardStyles']
}

export function CourseListGroup({
  collapsed,
  disableHeavyEffects,
  handleCourseClick,
  handleLearningPathCourseClick,
  interfaceTransition,
  onToggle,
  orgColors,
  section,
  t,
  userDashboardStyles,
}: CourseListGroupProps) {
  return (
    <section className={styles.listGroup}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.listGroupTrigger}
        aria-expanded={!collapsed}
      >
        <span className={styles.listGroupHeading}>
          <span className={styles.listGroupChevron} style={{ color: orgColors.accent }}>
            <ChevronDown
              className={`${styles.listGroupChevronIcon} ${collapsed ? styles.listGroupChevronCollapsed : ''}`}
              aria-hidden="true"
            />
          </span>
          <span className={styles.listGroupCopy}>
            <span className={styles.listGroupTitle} style={{ color: orgColors.text }}>
              {section.title}
            </span>
            <span className={styles.listGroupSummary} style={{ color: orgColors.textSecondary }}>
              {section.summary}
            </span>
          </span>
        </span>
        <span className={styles.listGroupCount} style={{ color: orgColors.textSecondary }}>
          {section.entries.length} {t('dashboard.learningPaths.coursesLabel', 'cursos')}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={interfaceTransition}
            className={styles.listGroupMotion}
          >
            <div className={styles.listCourseStack}>
              {section.entries.map((entry, index) => (
                <CourseCard3D
                  key={`${section.id}-${entry.course.course_id}-${entry.position ?? index}`}
                  course={entry.course}
                  index={index}
                  onClick={() => entry.assigned ? handleCourseClick(entry.course) : handleLearningPathCourseClick(entry.course.slug)}
                  onCertificateClick={
                    entry.course.progress === 100 && entry.course.has_certificate
                      ? () => handleCourseClick(entry.course, 'certificate')
                      : undefined
                  }
                  styles={userDashboardStyles}
                  viewMode="list"
                  learningPathTitle={entry.pathTitle}
                  learningPathPosition={entry.position}
                  isLockedInPath={entry.isLocked}
                  disableHeavyEffects={disableHeavyEffects}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
