import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnActivitySummary,
  LearnCourseData,
  LearnLesson,
  LearnMaterialSummary,
  LearnModule,
  LearnTab,
  LessonQuizStatus,
} from '../../components/learn/types'

export interface BuildLearnLessonContextParams {
  course: LearnCourseData | null
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  workshopMetadata: CourseLessonContext | null
  slug: string
  userJobTitle?: string
  transcriptContent?: string | null
  summaryContent?: string | null
  activeTab?: LearnTab
  currentPage?: string
  currentActivities?: LearnActivitySummary[]
  currentMaterials?: LearnMaterialSummary[]
  quizStatus?: LessonQuizStatus | null
  currentActivityPrompts?: string[]
}
