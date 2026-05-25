import type { AssignedCourse } from '../../types'
import { CourseTileFooter } from './CourseTileFooter'
import { CourseTileMedia } from './CourseTileMedia'
import { CourseTileProgress } from './CourseTileProgress'
import { clampProgress } from './progress'
import { translateCourseStatus } from './status'
import type { LearningPathCourseTileProps } from './types'
import { useCourseTileInteractions } from './useCourseTileInteractions'

export function LearningPathCourseTile({
  course,
  item,
  learningPathTitle,
  orgColors,
  onOpen,
  onCertificateClick,
  onPreview,
  onPreviewEnd,
  t,
  disableHeavyEffects,
}: LearningPathCourseTileProps) {
  const progress = clampProgress(course.progress)
  const displayStatus: AssignedCourse['status'] =
    progress <= 0 && course.status !== 'Completado' ? 'No iniciado' : course.status
  const isLocked = !item.isUnlocked
  const isCompleted = item.isCompleted || progress >= 100
  const canOpen = !isLocked && Boolean(course.slug || item.slug)
  const statusLabel = isLocked
    ? t('dashboard.learningPaths.lockedHint', 'Completa el curso anterior')
    : isCompleted
      ? t('dashboard.learningPaths.status.completed', 'Completado')
      : translateCourseStatus(displayStatus, t)
  const handlers = useCourseTileInteractions({
    canOpen,
    course,
    item,
    learningPathTitle,
    onOpen,
    onPreview,
    onPreviewEnd,
    t,
  })

  return (
    <article
      data-tour-id="business-user-dashboard--course-card"
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : -1}
      onClick={handlers.handleClick}
      onKeyDown={handlers.handleKeyDown}
      onMouseEnter={handlers.handleMouseEnter}
      onMouseLeave={handlers.handleMouseLeave}
      onFocus={handlers.handleFocus}
      onBlur={handlers.handleBlur}
      onTouchStart={handlers.handleTouchStart}
      onTouchMove={handlers.handleTouchMove}
      onTouchEnd={handlers.handleTouchEnd}
      className={`group flex-none snap-start outline-none ${canOpen ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      aria-disabled={!canOpen}
      style={{ opacity: isLocked ? 0.56 : 1, width: 'clamp(260px, calc((100% - 96px) / 5), 340px)' }}
    >
      <CourseTileMedia
        course={course}
        item={item}
        orgColors={orgColors}
        isLocked={isLocked}
        isCompleted={isCompleted}
        disableHeavyEffects={disableHeavyEffects}
      />
      <h4
        className="mt-3 line-clamp-3 min-h-[60px] text-[15px] font-bold leading-tight transition-colors group-hover:underline md:text-base"
        style={{ color: isLocked ? orgColors.textSecondary : orgColors.text }}
      >
        {course.title}
      </h4>
      <p className="mt-1 truncate text-xs" style={{ color: orgColors.textSecondary }}>
        {course.instructor || learningPathTitle}
      </p>
      <CourseTileProgress progress={progress} orgColors={orgColors} />
      <CourseTileFooter
        course={course}
        isCompleted={isCompleted}
        isLocked={isLocked}
        onCertificateClick={onCertificateClick}
        orgColors={orgColors}
        statusLabel={statusLabel}
        t={t}
      />
    </article>
  )
}
