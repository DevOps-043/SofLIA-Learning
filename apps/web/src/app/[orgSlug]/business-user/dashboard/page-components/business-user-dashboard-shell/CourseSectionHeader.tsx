import { cloneElement, type CSSProperties, type ReactElement } from 'react'
import { GraduationCap, LayoutGrid, List } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'

import type { BusinessUserDashboardShellProps, CourseViewMode } from './types'

interface CourseSectionHeaderProps {
  courseView: CourseViewMode
  disableHeavyEffects: boolean
  hasCourses: boolean
  interfaceTransition: Transition
  onCourseViewChange: (view: CourseViewMode) => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function CourseSectionHeader({
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
      initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : interfaceTransition}
      className="mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-xl border p-2"
          style={{
            background: `linear-gradient(135deg, ${orgColors.iconColor}25, ${orgColors.iconColor}08)`,
            borderColor: `${orgColors.iconColor}30`,
          }}
        >
          <GraduationCap className="h-5 w-5" style={{ color: orgColors.iconColor }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>
            {t('sidebar.courses')}
          </h2>
          <p className="text-sm" style={{ color: orgColors.textSecondary }}>
            {t('dashboard.quickActions.assignCourses.desc', 'Continua donde lo dejaste')}
          </p>
        </div>
      </div>
      {hasCourses ? (
        <div
          id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.courseViewSwitcher}
          className="flex shrink-0 items-center rounded-lg border p-1"
          style={{ backgroundColor: `${orgColors.cardBg}80`, borderColor: orgColors.border }}
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
      className={`rounded-md p-2.5 transition-colors sm:p-1.5 ${isActive ? 'bg-white/20 shadow-sm dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
      title={label}
    >
      {cloneElement(icon, {
        className: 'h-5 w-5 sm:h-4 sm:w-4',
        style: { color: isActive ? orgColors.iconColor : orgColors.textSecondary },
      })}
    </button>
  )
}
