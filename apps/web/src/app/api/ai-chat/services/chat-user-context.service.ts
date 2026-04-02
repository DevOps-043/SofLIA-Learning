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
>

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
  courseContext?: CourseLessonContext
}

async function loadChatUserInfo(
  supabase: SupabaseServerClient,
  authenticatedUser?: AuthenticatedUser | null,
) {
  if (!authenticatedUser) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select(
      'display_name, username, first_name, last_name, profile_picture_url, type_rol',
    )
    .eq('id', authenticatedUser.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as ChatUserInfo
}

export async function resolveChatUserContext({
  supabase,
  authenticatedUser,
  requestUserInfo,
  userName,
  courseContext,
}: ResolveChatUserContextParams): Promise<ResolveChatUserContextResult> {
  const userInfo = requestUserInfo
    ? (requestUserInfo as ChatUserInfo)
    : await loadChatUserInfo(supabase, authenticatedUser)

  const displayName =
    userInfo?.first_name ||
    userInfo?.display_name ||
    userInfo?.username ||
    userName ||
    'usuario'

  const userRole = userInfo?.type_rol || courseContext?.userRole || undefined
  const normalizedCourseContext =
    courseContext && userRole && !courseContext.userRole
      ? { ...courseContext, userRole }
      : courseContext

  return {
    userInfo,
    displayName,
    userRole,
    courseContext: normalizedCourseContext,
  }
}
