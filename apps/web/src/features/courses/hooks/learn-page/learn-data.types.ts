import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
  LearnNotesStats,
  LearnPathBlockState,
  LearnPathState,
  LearnTranslationContext,
} from '../../components/learn/types'
import type { WorkshopMetadataPayload } from './learn-page.service'

export interface LearnDataResponse {
  course?: LearnCourseData
  modules?: LearnModule[]
  lastWatchedLessonId?: string
  notesStats?: LearnNotesStats
  learningPath?: LearnPathState | null
  translationContext?: LearnTranslationContext
}

export interface LearnDataErrorResponse {
  error?: string
  message?: string
  learningPath?: LearnPathState | null
}

export interface WorkshopMetadataResponse {
  success?: boolean
  metadata?: WorkshopMetadataPayload
}

export interface UseLearnPageCourseDataParams {
  slug: string
  selectedLang: string
  organizationId?: string | null
  userJobTitle?: string
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  notesStatsLessonsWithNotes: string
  applyServerNotesStats: (stats: LearnNotesStats) => void
  initializeNotesStats: () => void
  setCourse: (course: LearnCourseData | null) => void
  setModules: (modules: LearnModule[]) => void
  setCurrentLesson: (lesson: LearnLesson | null) => void
  setWorkshopMetadata: (context: CourseLessonContext | null) => void
  setLiaTranscript: (transcript: string | null) => void
  setLiaSummary: (summary: string | null) => void
  setIsLiaTranscriptLoading: (loading: boolean) => void
  setIsLiaSummaryLoading: (loading: boolean) => void
  setLoading: (loading: boolean) => void
  setCourseProgress: (progress: number) => void
  setLearningPathState: (state: LearnPathState | null) => void
  setLearningPathBlockState: (state: LearnPathBlockState | null) => void
  setLearnDataTranslationContext: (
    context: LearnTranslationContext | null,
  ) => void
}

export class LearnDataRequestError extends Error {
  status: number
  payload: LearnDataErrorResponse | null

  constructor(status: number, payload: LearnDataErrorResponse | null) {
    super(payload?.message || `HTTP ${status}`)
    this.name = 'LearnDataRequestError'
    this.status = status
    this.payload = payload
  }
}
