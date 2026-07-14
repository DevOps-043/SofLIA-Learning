import type { CourseLessonContext } from '@/core/types/lia.types'
import {
  resolveActiveOrganizationAiContext,
  type ResolvedOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { PageContext } from '../system-prompt.types'
import type { RequestUserInfo } from './request-normalization.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type ChatUserInfo = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'display_name'
  | 'username'
  | 'first_name'
  | 'last_name'
  | 'profile_picture_url'
> & {
  job_title?: string | null
  job_description?: string | null
}

interface AuthenticatedUser {
  id: string
}

interface ResolveChatUserContextParams {
  authenticatedUser?: AuthenticatedUser | null
  courseContext?: CourseLessonContext
  pageContext?: PageContext
  requestUserInfo?: RequestUserInfo
  supabase: SupabaseServerClient
  userName?: string
}

export interface ResolveChatUserContextResult {
  courseContext?: CourseLessonContext
  displayName: string
  organizationAiContext?: ResolvedOrganizationAiContext | null
  userInfo: ChatUserInfo | null
  userRole?: string
  userRoleDescription?: string
}

const GENERIC_ROLE_LIKE_NAMES = new Set([
  'admin',
  'administrator',
  'administrador',
  'administradora',
  'business',
  'businessuser',
  'business user',
  'business_user',
  'instructor',
  'instructora',
  'user',
  'usuario',
  'usuaria',
  'guest',
  'invitado',
  'invitada',
])

function isUsableDisplayName(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  if (trimmed.length < 2) {
    return false
  }

  if (trimmed.includes('@')) {
    return false
  }

  return !GENERIC_ROLE_LIKE_NAMES.has(trimmed.toLowerCase())
}

function pickUsableName(...candidates: Array<string | null | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (isUsableDisplayName(candidate)) {
      return candidate.trim()
    }
  }
  return undefined
}

function preferTruthy<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }
  return null
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
      'display_name, username, first_name, last_name, profile_picture_url',
    )
    .eq('id', authenticatedUser.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as ChatUserInfo
}

async function loadOrganizationAiContext(input: {
  authenticatedUser?: AuthenticatedUser | null
  pageContext?: PageContext
}) {
  if (!input.authenticatedUser) {
    return null
  }

  return resolveActiveOrganizationAiContext({
    currentPage: input.pageContext?.pathname,
    userId: input.authenticatedUser.id,
  })
}

export async function resolveChatUserContext({
  supabase,
  authenticatedUser,
  requestUserInfo,
  userName,
  courseContext,
  pageContext,
}: ResolveChatUserContextParams): Promise<ResolveChatUserContextResult> {
  const [databaseUserInfo, organizationAiContext] = await Promise.all([
    loadChatUserInfo(supabase, authenticatedUser),
    loadOrganizationAiContext({ authenticatedUser, pageContext }),
  ])
  const requestInfo = requestUserInfo ? (requestUserInfo as ChatUserInfo) : null

  // La DB es la fuente autoritativa. requestInfo solo rellena campos vacios
  // para evitar que valores null/undefined del cliente pisen datos validos de la DB.
  const userInfo = (databaseUserInfo || requestInfo || organizationAiContext)
    ? {
        display_name: preferTruthy(databaseUserInfo?.display_name, requestInfo?.display_name),
        username: preferTruthy(databaseUserInfo?.username, requestInfo?.username),
        first_name: preferTruthy(databaseUserInfo?.first_name, requestInfo?.first_name),
        last_name: preferTruthy(databaseUserInfo?.last_name, requestInfo?.last_name),
        profile_picture_url: preferTruthy(
          databaseUserInfo?.profile_picture_url,
          requestInfo?.profile_picture_url,
        ),
        job_title: preferTruthy(
          organizationAiContext?.userJobTitle,
          databaseUserInfo?.job_title,
          requestInfo?.job_title,
        ),
        job_description: preferTruthy(
          organizationAiContext?.userJobDescription,
          databaseUserInfo?.job_description,
          requestInfo?.job_description,
        ),
      } as ChatUserInfo
    : null

  // Saltamos valores genericos tipo "Admin", "Usuario", emails, etc.
  // que no son nombres reales y producirian saludos como "Hola Admin".
  const displayName =
    pickUsableName(
      userInfo?.first_name,
      userInfo?.display_name,
      userInfo?.username,
      userName,
    ) || 'usuario'

  // El cargo del usuario vive en `organization_users.job_title` (la antigua
  // `users.type_rol` fue eliminada de la base).
  const userRole =
    userInfo?.job_title || courseContext?.userRole || undefined
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
    organizationAiContext,
    courseContext: normalizedCourseContext,
  }
}
