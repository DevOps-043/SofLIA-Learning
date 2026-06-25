import { cloneElement, type CSSProperties, type ReactElement } from 'react'
import { GraduationCap, LayoutGrid, List } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'

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
      data-tour-id="business-user-dashboard--courses-header"
      initial={disableHeavyEffects ? false : { opacity: 0, y: 10 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : interfaceTransition}
      className="mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-xl border p-2"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${orgColors.iconColor} 14.5%, transparent), color-mix(in srgb, ${orgColors.iconColor} 3.1%, transparent))`,
            borderColor: `color-mix(in srgb, ${orgColors.iconColor} 18.8%, transparent)`,
          }}
        >
          <GraduationCap className="h-5 w-5" style={{ color: orgColors.iconColor }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>
            {t('sidebar.courses')}
          </h2>
        </div>
      </div>
      {hasCourses ? (
        <div
          data-tour-id="business-user-dashboard--view-toggle"
          className="flex shrink-0 items-center rounded-lg border p-1"
          style={{ backgroundColor: `color-mix(in srgb, ${orgColors.cardBg} 50.2%, transparent)`, borderColor: orgColors.border }}
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
