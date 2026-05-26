import type { AssignedLearningPath, BusinessUserDashboardColors } from '../../types'
import { buildLearningPathPreviewContent } from './preview-content'
import { IntroVideoButton } from './IntroVideoButton'
import type {
  InfoHoverCardContent,
  IntroVideoState,
  LearningPathTranslator,
} from './types'

interface LearningPathHeaderProps {
  intro: IntroVideoState
  learningPath: AssignedLearningPath
  orgColors: BusinessUserDashboardColors
  pathIndex: number
  summary: string
  onOpenTour: () => void
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  t: LearningPathTranslator
}

export function LearningPathHeader({
  intro,
  learningPath,
  orgColors,
  pathIndex,
  summary,
  onOpenTour,
  onPreview,
  onPreviewEnd,
  t,
}: LearningPathHeaderProps) {
  const hasTour = Boolean(intro.introVideoUrl)

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2
          data-tour-id="business-user-dashboard--learning-path-title"
          className="inline-block max-w-full cursor-help truncate text-2xl font-bold leading-tight outline-none"
          style={{ color: orgColors.text }}
          tabIndex={0}
          onMouseEnter={(event) => onPreview(event.currentTarget, buildLearningPathPreviewContent(learningPath, t))}
          onMouseLeave={onPreviewEnd}
          onFocus={(event) => onPreview(event.currentTarget, buildLearningPathPreviewContent(learningPath, t))}
          onBlur={onPreviewEnd}
        >
          {learningPath.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: orgColors.textSecondary }}>
          {summary}
        </p>
      </div>
      {intro.loading || hasTour ? (
        <IntroVideoButton
          intro={intro}
          orgColors={orgColors}
          onClick={onOpenTour}
          t={t}
        />
      ) : null}
    </div>
  )
}
