import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { CourseLessonContext } from '@/core/types/lia.types'
import type { RequestUserInfo } from './request-normalization.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type ChatUserInfo = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'display_name'
  | 'username'
  | 'first_name'
  | 'last_name'
  | 'profile_picture_url'
  | 'type_rol'
> & {
  job_title?: string | null
  job_description?: string | null
}

interface AuthenticatedUser {
  id: string
}

interface ResolveChatUserContextParams {
  supabase: SupabaseServerClient
  authenticatedUser?: AuthenticatedUser | null
  requestUserInfo?: RequestUserInfo
  userName?: string
  courseContext?: CourseLessonContext
}

export interface ResolveChatUserContextResult {
  userInfo: ChatUserInfo | null
  displayName: string
  userRole?: string
  userRoleDescription?: string
  courseContext?: CourseLessonContext
}

async function loadChatUserInfo(
  supabase: SupabaseServerClient,
  authenticatedUser?: AuthenticatedUser | null,
) {
  if (!authenticatedUser) {
    return null
  }

  const [{ data, error }, { data: membership }] = await Promise.all([
    supabase
    .from('users')
    .select(
      'display_name, username, first_name, last_name, profile_picture_url, type_rol',
    )
    .eq('id', authenticatedUser.id)
    .single(),
    supabase
      .from('organization_users')
      .select('job_title, job_description')
      .eq('user_id', authenticatedUser.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (error || !data) {
    return null
  }

  return {
    ...(data as ChatUserInfo),
    job_title: membership?.job_title ?? null,
    job_description: membership?.job_description ?? null,
  }
}

export async function resolveChatUserContext({
  supabase,
  authenticatedUser,
  requestUserInfo,
  userName,
  courseContext,
}: ResolveChatUserContextParams): Promise<ResolveChatUserContextResult> {
  const databaseUserInfo = await loadChatUserInfo(supabase, authenticatedUser)
  const requestInfo = requestUserInfo ? (requestUserInfo as ChatUserInfo) : null
  const userInfo = (databaseUserInfo || requestInfo)
    ? {
        ...databaseUserInfo,
        ...requestInfo,
        job_title: databaseUserInfo?.job_title || requestInfo?.job_title || null,
        job_description: databaseUserInfo?.job_description || requestInfo?.job_description || null,
        type_rol: databaseUserInfo?.job_title || requestInfo?.type_rol || databaseUserInfo?.type_rol || null,
      } as ChatUserInfo
    : null

  const displayName =
    userInfo?.first_name ||
    userInfo?.display_name ||
    userInfo?.username ||
    userName ||
    'usuario'

  const userRole = userInfo?.job_title || userInfo?.type_rol || courseContext?.userRole || undefined
  const userRoleDescription = userInfo?.job_description || undefined
  const normalizedCourseContext =
    courseContext && userRole && !courseContext.userRole
      ? { ...courseContext, userRole }
      : courseContext

  return {
    userInfo,
    displayName,
    userRole,
    userRoleDescription,
    courseContext: normalizedCourseContext,
  }
}
