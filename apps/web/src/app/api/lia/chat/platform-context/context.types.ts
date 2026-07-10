import type { LiaImageAttachment } from '@/core/reporting/report-problem.contract'
import type { CurrentLessonContext } from './lesson-context.types'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: LiaImageAttachment[]
}

export interface UserCourse {
  title: string | undefined
  slug: string | undefined
  progress: number | null
  status: string
}

export interface UserLessonProgressItem {
  lessonTitle: string | undefined
  lessonDescription: string | undefined
  lessonOrder: number | undefined
  moduleName: string | undefined
  moduleOrder: number | undefined
  courseName: string | undefined
  courseSlug: string | undefined
  status: string
  isCompleted: boolean
  videoProgress: number | null
  timeSpentMinutes: number | null
  durationMinutes: number
}

export interface CourseWithContent {
  title: string | undefined
  slug: string | undefined
  description: string | undefined
  level: string | undefined
  durationMinutes: number | undefined
  isAssigned: boolean
}

export interface PlatformContext {
  userName?: string
  userRole?: string
  userJobTitle?: string
  userJobDescription?: string
  userId?: string
  currentPage?: string
  currentTab?: string
  pageType?: string
  // Contenido visible en pantalla (incluye modales/paneles), capturado por el
  // cliente para que SofLIA pueda explicar lo que el usuario ve ahora mismo.
  pageTitle?: string
  pageHeadings?: string[]
  pageVisibleText?: string
  pageContentSource?: 'dialog' | 'main' | 'body' | 'none'
  organizationId?: string
  organizationName?: string
  organizationSlug?: string
  organizationIndustry?: string
  organizationSize?: string
  organizationType?: string
  organizationMission?: string
  organizationCountry?: string
  noCoursesAssigned?: boolean
  [key: string]: unknown
  totalCourses?: number
  totalUsers?: number
  totalOrganizations?: number
  userCourses?: UserCourse[]
  recentActivity?: Record<string, unknown>[]
  platformStats?: Record<string, unknown>
  coursesWithContent?: CourseWithContent[]
  userLessonProgress?: UserLessonProgressItem[]
  currentLessonContext?: CurrentLessonContext
  currentActivityContext?: {
    id?: string
    title: string
    type: string
    description: string
    prompts?: string[]
  }
  userCheck?: {
    area?: string
    companySize?: string
  }
}

export interface ChatRequest {
  messages: ChatMessage[]
  context?: PlatformContext
  stream?: boolean
  enrichedMetadata?: Record<string, unknown>
  isBugReport?: boolean
}
