import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'

import { CourseCard3D } from './dynamic-components'
import type { BusinessUserDashboardShellProps, CourseListSection } from './types'

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
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 outline-none transition-all duration-200 hover:bg-white/5"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5" style={{ color: orgColors.accent }}>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight" style={{ color: orgColors.text }}>
              {section.title}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: orgColors.textSecondary }}>
              {section.summary}
            </p>
          </div>
        </div>
        <div className="mx-2 hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block" />
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: orgColors.textSecondary }}>
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
            className="overflow-hidden"
          >
            <div className="ml-4 grid grid-cols-1 gap-3 pb-4 sm:gap-4 md:ml-12">
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
    </div>
  )
}
