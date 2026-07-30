import { cloneElement, type CSSProperties, type ReactElement } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

import type { BusinessUserDashboardShellProps, CourseViewMode } from './types'
import styles from '../BusinessUserDashboard.module.css'

interface CourseSectionHeaderProps {
  courseCount: number
  courseView: CourseViewMode
  disableHeavyEffects: boolean
  hasCourses: boolean
  interfaceTransition: Transition
  onCourseViewChange: (view: CourseViewMode) => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function CourseSectionHeader({
  courseCount,
  courseView,
  disableHeavyEffects,
  hasCourses,
  interfaceTransition,
  onCourseViewChange,
  orgColors,
  t,
}: CourseSectionHeaderProps) {
  return (
    <motion.div
      data-tour-id="business-user-dashboard--courses-header"
      initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : interfaceTransition}
      className={styles.coursesHeader}
    >
      <div>
        <h2 className={styles.coursesTitle}>
          {t('sidebar.courses', 'Tus cursos')}
        </h2>
        <p className={styles.coursesMeta}>
          {t(
            'dashboard.courses.experienceCount',
            `${courseCount} ${courseCount === 1 ? 'experiencia asignada' : 'experiencias asignadas'}`,
          )}
        </p>
      </div>
      {hasCourses ? (
        <div
          data-tour-id="business-user-dashboard--view-toggle"
          className={styles.viewToggle}
        >
          <CourseViewButton icon={<LayoutGrid />} isActive={courseView === 'grid'} label={t('dashboard.view.grid', 'Vista cuadricula')} onClick={() => onCourseViewChange('grid')} orgColors={orgColors} />
          <CourseViewButton icon={<List />} isActive={courseView === 'list'} label={t('dashboard.view.list', 'Vista lista')} onClick={() => onCourseViewChange('list')} orgColors={orgColors} />
        </div>
      ) : null}
    </motion.div>
  )
}

function CourseViewButton({
  icon,
  isActive,
  label,
  onClick,
  orgColors,
}: {
  icon: ReactElement<{ className?: string; style?: CSSProperties }>
  isActive: boolean
  label: string
  onClick: () => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
}) {
  return (
    <button
      onClick={onClick}
      className={`${styles.viewButton} ${isActive ? styles.viewButtonActive : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      {cloneElement(icon, {
        className: 'h-4 w-4',
        style: { color: isActive ? orgColors.onPrimary : orgColors.textSecondary },
      })}
    </button>
  )
}
