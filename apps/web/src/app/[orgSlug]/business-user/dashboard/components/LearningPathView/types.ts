import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
  BusinessUserDashboardColors,
} from '../../types'

export type LearningPathTranslator = (
  key: string,
  defaultValue?: string,
) => string

export interface LearningPathViewProps {
  learningPaths: AssignedLearningPath[]
  assignedCourses: AssignedCourse[]
  orgColors: BusinessUserDashboardColors
  orgSlug: string
  onOpenCourse: (slug: string | null | undefined) => void
  onCourseClick: (course: AssignedCourse) => void
  onCertificateClick?: (course: AssignedCourse) => void
  disableHeavyEffects?: boolean
  t: LearningPathTranslator
}

export interface LearningPathCourseTileProps {
  course: AssignedCourse
  item: AssignedLearningPathItem
  learningPathTitle: string
  orgColors: BusinessUserDashboardColors
  onOpen: () => void
  onCertificateClick?: () => void
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  t: LearningPathTranslator
  disableHeavyEffects: boolean
}

export interface IntroVideoState {
  introVideoUrl: string | null
  watched: boolean
  loading: boolean
  showPlayer: boolean
}

export interface IntroVideoResponse {
  success?: boolean
  introVideoUrl?: string | null
  watched?: boolean
}

export interface InfoHoverCardContent {
  key: string
  kind: 'course' | 'learning_path'
  targetId: string
  title: string
  meta: string
  description: string
  points: string[]
  progress?: number
  status?: string
  loading?: boolean
  source?: 'gemini' | 'openai' | 'fallback'
  model?: string
}

export interface InfoHoverCardState extends InfoHoverCardContent {
  rect: DOMRect
}

export interface GeminiPreviewResponse {
  success?: boolean
  description?: string
  points?: string[]
  source?: 'gemini' | 'openai' | 'fallback'
  model?: string
}

export type PreviewCacheValue = Pick<
  InfoHoverCardContent,
  'description' | 'points' | 'source' | 'model'
>
