import type { createAdminClient } from '@/lib/supabase/admin'

export type SupabaseClient = ReturnType<typeof createAdminClient>

export type LooseQueryError = {
  message: string
  code?: string
  details?: string
}

export type DeleteOperationResult = PromiseLike<{
  error: LooseQueryError | null
}>

export type TableDeleteOptions = {
  label?: string
  ignoreMissingRelation?: boolean
}

export type TableSelectOptions = {
  ignoreMissingRelation?: boolean
}

export type CourseHierarchyIds = {
  moduleIds: string[]
  lessonIds: string[]
  materialIds: string[]
  activityIds: string[]
  teamIds: string[]
  certificateIds: string[]
  conversationIds: string[]
  questionIds: string[]
  responseIds: string[]
}

export type WorkshopDeletionContext = CourseHierarchyIds & {
  workshopId: string
}
