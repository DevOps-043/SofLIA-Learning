import Image from 'next/image'
import { CheckCircle2, Lock } from 'lucide-react'
import type {
  AssignedCourse,
  AssignedLearningPathItem,
  BusinessUserDashboardColors,
} from '../../types'

interface CourseTileMediaProps {
  course: AssignedCourse
  item: AssignedLearningPathItem
  orgColors: BusinessUserDashboardColors
  isLocked: boolean
  isCompleted: boolean
  disableHeavyEffects: boolean
}

export function CourseTileMedia({
  course,
  item,
  orgColors,
  isLocked,
  isCompleted,
  disableHeavyEffects,
}: CourseTileMediaProps) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-md border"
      style={{
        backgroundColor: `color-mix(in srgb, ${orgColors.textMuted} 7.8%, transparent)`,
        borderColor: orgColors.border,
      }}
    >
      <Image
        src={course.thumbnail || '/images/course-placeholder.png'}
        alt={course.title}
        fill
        className={`object-cover ${isLocked ? 'grayscale' : ''} ${
          disableHeavyEffects ? '' : 'transition-transform duration-300 group-hover:scale-[1.03]'
        }`}
        sizes="(max-width: 768px) 320px, 410px"
      />
      {isLocked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700">
            <Lock className="h-5 w-5" />
          </span>
        </div>
      ) : null}
      <span
        className="absolute left-2 top-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold shadow-sm"
        style={{ backgroundColor: orgColors.cardBg, color: orgColors.text }}
      >
        {item.position}
      </span>
      {isCompleted ? (
        <span
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
          style={{ backgroundColor: orgColors.cardBg, color: orgColors.iconColor }}
        >
          <CheckCircle2 className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  )
}
